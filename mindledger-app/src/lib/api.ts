import {
  Assessment,
  AssessmentDefinition,
  AssessmentType,
  Client,
  Clinic,
  ConsentRecord,
  DPDPRequest,
  SessionNote,
  User,
  UserRole,
  WebSession,
} from '../types';
import { ASSESSMENT_DEFINITIONS } from '../data/clinicalData';

const API_URL = `${import.meta.env.BASE_URL}api/index.php`;
const TOKEN_KEY = 'mindledger_token';

function readToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable (private mode); the session lasts until reload
  }
}

let memoryToken = readToken();

export class ApiError extends Error {
  constructor(message: string, public code: string, public status: number) {
    super(message);
  }
}

type Json = Record<string, any>;

async function call<T = Json>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}?path=${encodeURIComponent(path)}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(memoryToken ? { 'X-Auth-Token': memoryToken } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Please check your internet connection.', 'network', 0);
  }
  const text = await res.text();
  let data: Json;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError(
      res.status === 404
        ? 'The MindLedger API was not found. Make sure the "api" folder was uploaded inside public_html/mindledger.'
        : `The server returned an unexpected response (HTTP ${res.status}). Check that PHP is enabled for this folder.`,
      'bad_response',
      res.status
    );
  }
  if (!res.ok || data.ok === false) {
    if (data.code === 'unauthenticated') {
      memoryToken = '';
      writeToken(null);
      sessionListener?.({ status: 'signed-out' });
    }
    throw new ApiError(data.error || `Request failed (HTTP ${res.status}).`, data.code || 'error', res.status);
  }
  return data as T;
}

// ---------------------------------------------------------------- Session

export type SessionState =
  | { status: 'signed-out' }
  | { status: 'setup' }
  | { status: 'error'; message: string; code: string }
  | { status: 'signed-in'; user: User; clinic: Clinic };

let sessionListener: ((s: SessionState) => void) | null = null;

function setSession(token: string, user: User, clinic: Clinic) {
  memoryToken = token;
  writeToken(token);
  sessionListener?.({ status: 'signed-in', user, clinic });
}

export function watchSession(cb: (s: SessionState) => void): () => void {
  sessionListener = cb;
  checkStatus();
  return () => {
    sessionListener = null;
  };
}

export async function checkStatus() {
  try {
    const data = await call<{ needs_setup: boolean; user: User | null; clinic: Clinic | null }>('GET', 'status');
    if (data.needs_setup) sessionListener?.({ status: 'setup' });
    else if (data.user && data.clinic) sessionListener?.({ status: 'signed-in', user: data.user, clinic: data.clinic });
    else sessionListener?.({ status: 'signed-out' });
  } catch (err) {
    const e = err as ApiError;
    sessionListener?.({ status: 'error', message: e.message, code: e.code });
  }
}

export async function signIn(email: string, password: string) {
  const data = await call<{ token: string; user: User; clinic: Clinic }>('POST', 'auth/login', { email: email.trim(), password });
  setSession(data.token, data.user, data.clinic);
}

export async function signOut() {
  try {
    await call('POST', 'auth/logout', {});
  } finally {
    memoryToken = '';
    writeToken(null);
    sessionListener?.({ status: 'signed-out' });
  }
}

export async function signUpClinic(input: { clinic_name: string; owner_name: string; email: string; password: string }) {
  const data = await call<{ token: string; user: User; clinic: Clinic }>('POST', 'auth/setup', input);
  setSession(data.token, data.user, data.clinic);
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  await call('POST', 'auth/password', { current_password: currentPassword, new_password: newPassword });
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
  sessions: WebSession[];
  websiteLinked: boolean;
}

export async function loadClinicData(): Promise<ClinicData> {
  return call<ClinicData>('GET', 'data');
}

// ---------------------------------------------------------------- Clinic & staff

export async function updateClinic(updates: Partial<Clinic>): Promise<Clinic> {
  const data = await call<{ clinic: Clinic }>('PATCH', 'clinic', updates);
  return data.clinic;
}

export async function addStaff(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  license_number?: string;
  avatar_url?: string;
}): Promise<User> {
  const data = await call<{ user: User }>('POST', 'staff', input);
  return data.user;
}

export async function removeStaff(staff: User) {
  await call('POST', `staff/${staff.id}/remove`, {});
}

export async function resetStaffPassword(staff: User, password: string) {
  await call('POST', `staff/${staff.id}/password`, { password });
}

// ---------------------------------------------------------------- Clients & consent

export async function createClient(input: Omit<Client, 'id' | 'clinic_id' | 'status' | 'created_at'>): Promise<Client> {
  const data = await call<{ client: Client }>('POST', 'clients', input);
  return data.client;
}

export async function assignClient(client: Client, clinicianId: string): Promise<Client> {
  const data = await call<{ client: Client }>('POST', `clients/${client.id}/assign`, { assigned_clinician_id: clinicianId });
  return data.client;
}

export async function bookSession(input: {
  client_id: string;
  clinician_id: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  mode: 'in_person' | 'online' | 'phone';
  notes?: string;
}): Promise<{ session: WebSession; client: Client }> {
  return call('POST', 'sessions', input);
}

export async function updateSessionStatus(session: WebSession, status: 'confirmed' | 'completed' | 'cancelled' | 'no_show') {
  const data = await call<{ session: WebSession }>('PATCH', `sessions/${session.id}`, { status });
  return data.session;
}

export async function withdrawConsent(client: Client, purpose: string, reason: string) {
  const data = await call<{ record: ConsentRecord }>('POST', `clients/${client.id}/consent-withdraw`, { purpose, reason });
  return data.record;
}

export async function eraseClient(client: Client) {
  await call('POST', `clients/${client.id}/erase`, {});
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

export async function createDpdpRequest(
  input: { client_name: string; client_contact: string; type: 'export' | 'erasure'; notes: string },
  _clients: Client[]
) {
  const data = await call<{ request: DPDPRequest }>('POST', 'dpdp', input);
  return data.request;
}

export async function completeDpdpRequest(req: DPDPRequest) {
  await call('POST', `dpdp/${req.id}/complete`, {});
}

// ---------------------------------------------------------------- Session notes

export async function saveNote(client: Client, existing: SessionNote | undefined, fields: Partial<SessionNote>): Promise<SessionNote> {
  if (existing) {
    const data = await call<{ note: SessionNote }>('PATCH', `notes/${existing.id}`, fields);
    return data.note;
  }
  const data = await call<{ note: SessionNote }>('POST', 'notes', { ...fields, client_id: client.id });
  return data.note;
}

export async function signNote(note: SessionNote): Promise<SessionNote> {
  const data = await call<{ note: SessionNote }>('POST', `notes/${note.id}/sign`, {});
  return data.note;
}

export async function addAddendum(note: SessionNote, text: string): Promise<SessionNote> {
  const data = await call<{ note: SessionNote }>('POST', `notes/${note.id}/addenda`, { text });
  return data.note;
}

// ---------------------------------------------------------------- Assessments

export function assessmentLink(token: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}assessment/${token}`;
}

export async function createAssessment(client: Client, type: AssessmentType): Promise<Assessment> {
  const data = await call<{ assessment: Assessment }>('POST', 'assessments', { client_id: client.id, type });
  return data.assessment;
}

export interface PublicAssessmentData {
  type: AssessmentType;
  definition: AssessmentDefinition;
  clientName: string;
  clinicName: string;
}

export async function getPublicAssessment(token: string): Promise<PublicAssessmentData> {
  const data = await call<{ type: AssessmentType; client_first_name: string; clinic_name: string }>(
    'GET',
    `public/assessment/${token}`
  );
  return {
    type: data.type,
    definition: ASSESSMENT_DEFINITIONS[data.type],
    clientName: data.client_first_name,
    clinicName: data.clinic_name,
  };
}

export async function submitPublicAssessment(token: string, responses: Record<number, number>) {
  await call('POST', `public/assessment/${token}`, { responses });
}
