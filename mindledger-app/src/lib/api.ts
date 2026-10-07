import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  writeBatch,
  QueryConstraint,
} from 'firebase/firestore';
import { auth, db, createSecondaryAuth } from './firebase';
import { ASSESSMENT_DEFINITIONS } from '../data/clinicalData';
import {
  Assessment,
  AssessmentDefinition,
  AssessmentType,
  Client,
  Clinic,
  ConsentRecord,
  DPDPRequest,
  NoteAddendum,
  SessionNote,
  User,
  UserRole,
  isCoordinator,
  isOwner,
  isPsychologist,
} from '../types';

const CONSENT_VERSION = 'DPDP-V1.2-2024';

let currentUser: User | null = null;
let currentClinic: Clinic | null = null;

function me(): User {
  if (!currentUser) throw new Error('You are signed out. Please sign in again.');
  return currentUser;
}

function newId(col: string): string {
  return doc(collection(db, col)).id;
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function displayDate(d = new Date()): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function displayDateTime(d = new Date()): string {
  return `${displayDate(d)}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

// Firestore rejects `undefined` field values.
function clean<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

function friendlyError(err: unknown): Error {
  const code = (err as { code?: string })?.code || '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'Incorrect email or password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email address already exists.',
    'auth/weak-password': 'Password must be at least 6 characters long.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'permission-denied': 'You do not have permission to do that.',
    unavailable: 'Cannot reach the database. Please check your internet connection.',
  };
  if (map[code]) return new Error(map[code]);
  return err instanceof Error ? err : new Error(String(err));
}

async function run<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw friendlyError(err);
  }
}

async function audit(action: string, entityType: string, entityId: string, details: string) {
  const u = me();
  const id = newId('audit_logs');
  try {
    await setDoc(doc(db, 'audit_logs', id), {
      id,
      clinic_id: u.clinic_id,
      actor_id: u.id,
      actor_name: u.name,
      action,
      entity_type: entityType,
      entity_id: entityId,
      timestamp: new Date().toISOString(),
      details,
    });
  } catch (err) {
    console.warn('Audit log write failed', err);
  }
}

async function listWhere<T>(col: string, ...constraints: QueryConstraint[]): Promise<T[]> {
  const snap = await getDocs(query(collection(db, col), ...constraints));
  return snap.docs.map((d) => d.data() as T);
}

function mergeById<T extends { id: string }>(...lists: T[][]): T[] {
  const map = new Map<string, T>();
  lists.flat().forEach((item) => map.set(item.id, item));
  return [...map.values()];
}

// ---------------------------------------------------------------- Auth

export type SessionState =
  | { status: 'signed-out' }
  | { status: 'removed'; email: string }
  | { status: 'signed-in'; user: User; clinic: Clinic };

async function resolveSession(fbUser: FirebaseUser): Promise<SessionState> {
  const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
  if (!userSnap.exists()) {
    currentUser = null;
    currentClinic = null;
    return { status: 'removed', email: fbUser.email || '' };
  }
  const user = userSnap.data() as User;
  const clinicSnap = await getDoc(doc(db, 'clinics', user.clinic_id));
  currentUser = user;
  currentClinic = clinicSnap.data() as Clinic;
  return { status: 'signed-in', user, clinic: currentClinic };
}

// Account creation signs the user in before their profile exists, so session
// resolution waits until sign-up has written the clinic and owner records.
let signupInProgress = false;
let sessionListener: ((s: SessionState) => void) | null = null;

export function watchSession(cb: (s: SessionState) => void): () => void {
  sessionListener = cb;
  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    if (signupInProgress) return;
    if (!fbUser) {
      currentUser = null;
      currentClinic = null;
      cb({ status: 'signed-out' });
      return;
    }
    try {
      cb(await resolveSession(fbUser));
    } catch (err) {
      console.error(err);
      cb({ status: 'signed-out' });
    }
  });
  return () => {
    sessionListener = null;
    unsubscribe();
  };
}

export function signIn(email: string, password: string) {
  return run(async () => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  });
}

export function signOut() {
  return fbSignOut(auth);
}

export function resetPassword(email: string) {
  return run(() => sendPasswordResetEmail(auth, email.trim()));
}

export function signUpClinic(input: { clinic_name: string; owner_name: string; email: string; password: string }) {
  signupInProgress = true;
  return run(async () => {
    try {
      return await createClinicAndOwner(input);
    } finally {
      signupInProgress = false;
      if (auth.currentUser && sessionListener) sessionListener(await resolveSession(auth.currentUser));
    }
  });
}

async function createClinicAndOwner(input: { clinic_name: string; owner_name: string; email: string; password: string }) {
  {
    const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
    const uid = cred.user.uid;
    const email = input.email.trim().toLowerCase();
    const ownerName = input.owner_name.trim();
    // The clinic id equals the founding owner's uid; the security rules rely on this.
    const clinic: Clinic = {
      id: uid,
      name: input.clinic_name.trim(),
      address: '',
      data_residency_region: 'Firebase Firestore',
      consent_officer_name: ownerName,
      consent_officer_email: email,
      consent_officer_phone: '',
      dpdp_officer_name: ownerName,
      dpdp_officer_email: email,
      upi_vpa: '',
      bank_name: '',
      bank_account_number: '',
      bank_ifsc: '',
      phone: '',
      email,
    };
    const owner: User = {
      id: uid,
      name: ownerName,
      email,
      phone: '',
      role: 'owner',
      clinic_id: uid,
      color: '#5749e2',
    };
    await setDoc(doc(db, 'clinics', uid), clinic);
    await setDoc(doc(db, 'users', uid), owner);
    currentUser = owner;
    currentClinic = clinic;
    await audit('CLINIC_REGISTERED', 'Clinic', uid, `Registered clinic "${clinic.name}" with owner ${ownerName} (${email}).`);
    return { clinic, user: owner };
  }
}

// ---------------------------------------------------------------- Loading

export interface ClinicData {
  clinic: Clinic;
  users: User[];
  clients: Client[];
  notes: SessionNote[];
  assessments: Assessment[];
  consentRecords: ConsentRecord[];
  dpdpRequests: DPDPRequest[];
}

export function loadClinicData(): Promise<ClinicData> {
  return run(async () => {
    const u = me();
    const cid = u.clinic_id;
    const byClinic = where('clinic_id', '==', cid);
    const clinicSnap = await getDoc(doc(db, 'clinics', cid));
    const clinic = clinicSnap.data() as Clinic;
    currentClinic = clinic;

    const users = await listWhere<User>('users', byClinic);

    let clients: Client[];
    let notes: SessionNote[] = [];
    let assessments: Assessment[] = [];
    let consentRecords: ConsentRecord[] = [];
    let dpdpRequests: DPDPRequest[] = [];

    if (isPsychologist(u.role)) {
      clients = await listWhere<Client>('clients', byClinic, where('assigned_clinician_id', '==', u.id));
      const [n1, n2, a1, a2] = await Promise.all([
        listWhere<SessionNote>('session_notes', byClinic, where('assigned_clinician_id', '==', u.id)),
        listWhere<SessionNote>('session_notes', byClinic, where('clinician_id', '==', u.id)),
        listWhere<Assessment>('assessments', byClinic, where('assigned_clinician_id', '==', u.id)),
        listWhere<Assessment>('assessments', byClinic, where('clinician_id', '==', u.id)),
      ]);
      notes = mergeById(n1, n2);
      assessments = mergeById(a1, a2);
      consentRecords = await listWhere<ConsentRecord>('consent_records', byClinic);
    } else {
      clients = await listWhere<Client>('clients', byClinic);
      consentRecords = await listWhere<ConsentRecord>('consent_records', byClinic);
      if (isOwner(u.role)) {
        [notes, assessments, dpdpRequests] = await Promise.all([
          listWhere<SessionNote>('session_notes', byClinic),
          listWhere<Assessment>('assessments', byClinic),
          listWhere<DPDPRequest>('dpdp_requests', byClinic),
        ]);
      }
    }

    clients.sort((a, b) => a.name.localeCompare(b.name));
    notes.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    assessments.sort((a, b) => (b.sent_at || '').localeCompare(a.sent_at || ''));
    consentRecords.sort((a, b) => (a.granted_at || a.withdrawn_at || '').localeCompare(b.granted_at || b.withdrawn_at || ''));
    dpdpRequests.sort((a, b) => (b.requested_on_iso || '').localeCompare(a.requested_on_iso || ''));

    return { clinic, users, clients, notes, assessments, consentRecords, dpdpRequests };
  });
}

// ---------------------------------------------------------------- Clinic & staff

export function updateClinic(updates: Partial<Clinic>) {
  return run(async () => {
    const u = me();
    const { id: _id, ...rest } = updates;
    const safe = clean(rest);
    await updateDoc(doc(db, 'clinics', u.clinic_id), safe);
    await audit('CLINIC_UPDATED', 'Clinic', u.clinic_id, 'Updated clinic profile and DPDP officer details.');
    const updated: Clinic = { ...(currentClinic as Clinic), ...safe };
    currentClinic = updated;
    return updated;
  });
}

export function addStaff(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  license_number?: string;
  avatar_url?: string;
}) {
  return run(async () => {
    const owner = me();
    const secondary = createSecondaryAuth();
    let uid: string;
    try {
      const cred = await createUserWithEmailAndPassword(secondary.auth, input.email.trim(), input.password);
      uid = cred.user.uid;
      await fbSignOut(secondary.auth);
    } finally {
      await secondary.dispose();
    }
    const staff: User = clean({
      id: uid,
      clinic_id: owner.clinic_id,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || '',
      role: input.role,
      license_number: input.license_number?.trim() || undefined,
      avatar_url: input.avatar_url || undefined,
      color: '#2A9D8F',
    });
    await setDoc(doc(db, 'users', uid), staff);
    await audit('STAFF_ADDED', 'User', uid, `Added ${staff.name} (${staff.email}) as ${staff.role}.`);
    return staff;
  });
}

export function removeStaff(staff: User) {
  return run(async () => {
    const owner = me();
    if (staff.id === owner.id) throw new Error('You cannot remove your own account.');
    if (staff.id === owner.clinic_id) throw new Error('The founding clinic owner cannot be removed.');
    await deleteDoc(doc(db, 'users', staff.id));
    await audit('STAFF_REMOVED', 'User', staff.id, `Removed ${staff.name} (${staff.email}, ${staff.role}) from the clinic.`);
  });
}

// ---------------------------------------------------------------- Clients & consent

export function createClient(input: Omit<Client, 'id' | 'clinic_id' | 'status' | 'created_at'>) {
  return run(async () => {
    const u = me();
    if (isPsychologist(u.role)) throw new Error('Psychologists cannot register new clients.');
    const id = newId('clients');
    const now = new Date();
    const client: Client = clean({
      ...input,
      id,
      clinic_id: u.clinic_id,
      status: 'active',
      created_at: now.toISOString().split('T')[0],
      consent_timestamp: input.consent_status === 'granted' ? now.toISOString() : undefined,
    });
    const batch = writeBatch(db);
    batch.set(doc(db, 'clients', id), client);
    if (client.consent_status === 'granted') {
      const consentId = newId('consent_records');
      batch.set(doc(db, 'consent_records', consentId), {
        id: consentId,
        clinic_id: u.clinic_id,
        client_id: id,
        purpose: 'Clinical care, record keeping and assessments',
        consent_text_version: CONSENT_VERSION,
        granted_at: displayDateTime(now),
        ip_address: `Recorded at intake by ${u.name}`,
        status: 'granted',
      });
    }
    await batch.commit();
    await audit('CLIENT_CREATED', 'Client', id, `Registered client file for ${client.name}.`);
    return client;
  });
}

export function withdrawConsent(client: Client, purpose: string, reason: string) {
  return run(async () => {
    const u = me();
    const id = newId('consent_records');
    const record: ConsentRecord & { clinic_id: string } = {
      id,
      clinic_id: u.clinic_id,
      client_id: client.id,
      purpose,
      consent_text_version: CONSENT_VERSION,
      withdrawn_at: displayDateTime(),
      ip_address: `Recorded by ${u.name}`,
      status: 'withdrawn',
    };
    await setDoc(doc(db, 'consent_records', id), record);
    if (isOwner(u.role) || isCoordinator(u.role)) {
      await updateDoc(doc(db, 'clients', client.id), { consent_status: 'withdrawn' });
    }
    await audit('CONSENT_WITHDRAWN', 'ConsentRecord', id, `Consent withdrawn for "${purpose}". Reason: ${reason}`);
    return record;
  });
}

export function eraseClient(client: Client) {
  return run(async () => {
    const u = me();
    if (!isOwner(u.role)) throw new Error('Only the clinic owner can execute the Right to Erasure.');
    await updateDoc(doc(db, 'clients', client.id), {
      name: `Anonymized Client #${client.id.slice(-4)}`,
      phone: '+91-REDACTED',
      email: 'redacted@dpdp.erased',
      emergency_contact_name: 'REDACTED',
      emergency_contact_phone: 'REDACTED',
      guardian_name: 'REDACTED',
      guardian_contact: 'REDACTED',
      date_of_birth: 'REDACTED',
      anonymized: true,
      status: 'inactive',
    });
    const pending = await listWhere<DPDPRequest>(
      'dpdp_requests',
      where('clinic_id', '==', u.clinic_id),
      where('client_id', '==', client.id)
    );
    await Promise.all(
      pending
        .filter((r) => r.type === 'erasure' && r.status !== 'completed')
        .map((r) =>
          updateDoc(doc(db, 'dpdp_requests', r.id), {
            status: 'completed',
            completed_at: displayDate(),
            processed_by: u.name,
          })
        )
    );
    await audit('DPDP_RIGHT_TO_ERASURE_EXECUTED', 'Client', client.id, `Erased contact details of ${client.name}; clinical records anonymized.`);
  });
}

export function buildClientExport(
  clinic: Clinic,
  client: Client,
  notes: SessionNote[],
  assessments: Assessment[],
  consents: ConsentRecord[]
) {
  return {
    dpdp_compliance: 'Digital Personal Data Protection Act, 2023 (India)',
    data_fiduciary: clinic.name,
    grievance_officer: {
      name: clinic.dpdp_officer_name || clinic.consent_officer_name,
      email: clinic.dpdp_officer_email || clinic.consent_officer_email,
    },
    export_timestamp: new Date().toISOString(),
    client_profile: client,
    consent_history: consents,
    session_notes: notes.map(({ private_notes: _private, ...rest }) => rest),
    psychometric_assessments: assessments.map(({ secure_link_token: _token, ...rest }) => rest),
  };
}

export function createDpdpRequest(input: { client_name: string; client_contact: string; type: 'export' | 'erasure'; notes: string }, clients: Client[]) {
  return run(async () => {
    const u = me();
    const contact = input.client_contact.trim();
    const digits = contact.replace(/[^0-9]/g, '');
    const matched = clients.find(
      (c) => c.email.toLowerCase() === contact.toLowerCase() || (digits.length > 5 && c.phone.replace(/[^0-9]/g, '') === digits)
    );
    const id = newId('dpdp_requests');
    const req: DPDPRequest & { clinic_id: string } = {
      id,
      clinic_id: u.clinic_id,
      client_id: matched ? matched.id : 'unmatched',
      client_name: input.client_name || matched?.name || 'Unnamed requester',
      client_contact: contact,
      type: input.type,
      requested_on: displayDate(),
      requested_on_iso: new Date().toISOString(),
      status: 'pending',
      notes: input.notes || 'Recorded via Your Data Rights form.',
    };
    await setDoc(doc(db, 'dpdp_requests', id), req);
    await audit('DPDP_REQUEST_RECORDED', 'DPDPRequest', id, `${input.type} request recorded for ${req.client_name}.`);
    return req;
  });
}

export function completeDpdpRequest(req: DPDPRequest) {
  return run(async () => {
    const u = me();
    await updateDoc(doc(db, 'dpdp_requests', req.id), {
      status: 'completed',
      completed_at: displayDate(),
      processed_by: u.name,
    });
  });
}

// ---------------------------------------------------------------- Session notes

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function saveNote(client: Client, existing: SessionNote | undefined, fields: Partial<SessionNote>) {
  return run(async () => {
    const u = me();
    if (isCoordinator(u.role)) throw new Error('Client Coordinators cannot create or edit clinical session notes.');
    const now = new Date().toISOString();
    if (existing) {
      if (existing.status === 'signed') throw new Error('This note is signed and locked. Add an addendum instead.');
      const updates = clean({
        template_type: fields.template_type,
        content: fields.content,
        private_notes: fields.private_notes,
        duration_minutes: fields.duration_minutes,
        duration_seconds: fields.duration_seconds,
        started_at: fields.started_at,
        ended_at: fields.ended_at,
        updated_at: now,
      });
      await updateDoc(doc(db, 'session_notes', existing.id), updates);
      return { ...existing, ...updates } as SessionNote;
    }
    const id = newId('session_notes');
    const note = clean({
      id,
      clinic_id: u.clinic_id,
      client_id: client.id,
      assigned_clinician_id: client.assigned_clinician_id,
      clinician_id: u.id,
      clinician_name: u.name,
      template_type: fields.template_type || 'SOAP',
      content: fields.content || {},
      private_notes: fields.private_notes || '',
      duration_minutes: fields.duration_minutes || 0,
      duration_seconds: fields.duration_seconds || 0,
      started_at: fields.started_at || '',
      ended_at: fields.ended_at || '',
      status: 'draft' as const,
      addenda: [],
      created_at: now,
      updated_at: now,
    });
    await setDoc(doc(db, 'session_notes', id), note);
    await audit('NOTE_CREATED', 'SessionNote', id, `Created a session note for ${client.name}.`);
    return note as SessionNote;
  });
}

export function signNote(note: SessionNote) {
  return run(async () => {
    const u = me();
    if (note.status === 'signed') throw new Error('This note is already signed.');
    const signedAtIso = new Date().toISOString();
    const hash = await sha256Hex(
      JSON.stringify({ id: note.id, client: note.client_id, template: note.template_type, content: note.content, signer: u.id, at: signedAtIso })
    );
    const updates = {
      status: 'signed' as const,
      signed_at: displayDateTime(new Date(signedAtIso)),
      signed_at_iso: signedAtIso,
      signed_by: u.name,
      signed_by_id: u.id,
      signature_hash: `SHA256:${hash.slice(0, 32)}`,
      updated_at: signedAtIso,
    };
    await updateDoc(doc(db, 'session_notes', note.id), updates);
    await audit('NOTE_SIGNED', 'SessionNote', note.id, `Signed and locked note (${updates.signature_hash}).`);
    return { ...note, ...updates } as SessionNote;
  });
}

export function addAddendum(note: SessionNote, text: string) {
  return run(async () => {
    const u = me();
    if (!text.trim()) throw new Error('Addendum text cannot be empty.');
    const addendum: NoteAddendum = {
      id: `addendum-${Date.now()}`,
      text: text.trim(),
      added_by: u.name,
      added_at: displayDateTime(),
    };
    const updated_at = new Date().toISOString();
    await updateDoc(doc(db, 'session_notes', note.id), { addenda: arrayUnion(addendum), updated_at });
    await audit('ADDENDUM_ADDED', 'SessionNote', note.id, 'Appended an addendum to a signed note.');
    return { ...note, addenda: [...(note.addenda || []), addendum], updated_at } as SessionNote;
  });
}

// ---------------------------------------------------------------- Assessments

export function assessmentLink(token: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}assessment/${token}`;
}

export function createAssessment(client: Client, type: AssessmentType) {
  return run(async () => {
    const u = me();
    if (isCoordinator(u.role)) throw new Error('Client Coordinators cannot issue clinical assessments.');
    const token = randomToken();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    const assessment = {
      id: token,
      clinic_id: u.clinic_id,
      client_id: client.id,
      assigned_clinician_id: client.assigned_clinician_id,
      clinician_id: u.id,
      type,
      sent_at: new Date().toISOString(),
      secure_link_token: token,
      expires_at: expires.toISOString(),
      expires_at_ms: expires.getTime(),
      status: 'pending' as const,
      // Shown on the public questionnaire, which cannot read the client or clinic records.
      client_first_name: client.name.split(' ')[0],
      clinic_name: currentClinic?.name || '',
    };
    await setDoc(doc(db, 'assessments', token), assessment);
    await audit('ASSESSMENT_SENT', 'Assessment', token, `Issued ${type} link for ${client.name}.`);
    return assessment as Assessment;
  });
}

export interface PublicAssessmentData {
  assessment: Assessment;
  definition: AssessmentDefinition;
  clientName: string;
  clinicName: string;
  isCompleted: boolean;
  isExpired: boolean;
}

export function getPublicAssessment(token: string) {
  return run(async (): Promise<PublicAssessmentData | null> => {
    if (!/^[a-f0-9]{48}$/.test(token)) return null;
    const snap = await getDoc(doc(db, 'assessments', token));
    if (!snap.exists()) return null;
    const a = snap.data() as Assessment & { client_first_name?: string; clinic_name?: string };
    return {
      assessment: a,
      definition: ASSESSMENT_DEFINITIONS[a.type],
      clientName: a.client_first_name || 'there',
      clinicName: a.clinic_name || '',
      isCompleted: a.status === 'completed',
      isExpired: a.status !== 'completed' && new Date(a.expires_at).getTime() < Date.now(),
    };
  });
}

export function scoreAssessment(type: AssessmentType, responses: Record<number, number>) {
  const def = ASSESSMENT_DEFINITIONS[type];
  const score = Object.values(responses).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const band = def?.scoringBands.find((b) => score >= b.min && score <= b.max)?.severity || 'Minimal';
  return { score, band };
}

export function submitPublicAssessment(token: string, type: AssessmentType, responses: Record<number, number>) {
  return run(async () => {
    const { score, band } = scoreAssessment(type, responses);
    const now = new Date();
    await updateDoc(doc(db, 'assessments', token), {
      responses,
      score,
      severity_band: band,
      status: 'completed',
      completed_at: displayDate(now),
      completed_at_iso: now.toISOString(),
    });
  });
}
