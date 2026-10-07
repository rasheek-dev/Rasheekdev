import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';

const rulesPath = process.argv[2];
const env = await initializeTestEnvironment({
  projectId: 'demo-mindledger',
  firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync(rulesPath, 'utf8') },
});
await env.clearFirestore();

const results = [];
async function check(name, promise) {
  try {
    await promise;
    results.push(['PASS', name]);
  } catch (e) {
    results.push(['FAIL', name, e.message.split('\n')[0]]);
  }
}

const OWNER = 'owner1';
const CLIN = 'clin1';
const CLIN2 = 'clin2';
const COORD = 'coord1';
const OTHER_OWNER = 'owner2';

const owner = env.authenticatedContext(OWNER).firestore();
const clin = env.authenticatedContext(CLIN).firestore();
const clin2 = env.authenticatedContext(CLIN2).firestore();
const coord = env.authenticatedContext(COORD).firestore();
const other = env.authenticatedContext(OTHER_OWNER).firestore();
const anon = env.unauthenticatedContext().firestore();

// --- Sign-up
await check('owner creates own clinic', assertSucceeds(setDoc(doc(owner, 'clinics', OWNER), { id: OWNER, name: 'Mentra' })));
await check('owner creates own owner profile', assertSucceeds(setDoc(doc(owner, 'users', OWNER), { id: OWNER, clinic_id: OWNER, role: 'owner', name: 'Owner' })));
await check('stranger cannot create clinic with someone else id', assertFails(setDoc(doc(other, 'clinics', 'xyz'), { id: 'xyz', name: 'Evil' })));
await check('stranger cannot self-join existing clinic as owner', assertFails(setDoc(doc(other, 'users', OTHER_OWNER), { id: OTHER_OWNER, clinic_id: OWNER, role: 'owner' })));
await check('stranger cannot self-join existing clinic as clinician', assertFails(setDoc(doc(other, 'users', OTHER_OWNER), { id: OTHER_OWNER, clinic_id: OWNER, role: 'clinician' })));
await check('second clinic can register separately', assertSucceeds(setDoc(doc(other, 'clinics', OTHER_OWNER), { id: OTHER_OWNER, name: 'Other' })));
await check('second clinic owner profile', assertSucceeds(setDoc(doc(other, 'users', OTHER_OWNER), { id: OTHER_OWNER, clinic_id: OTHER_OWNER, role: 'owner' })));

// --- Staff
await check('owner adds clinician', assertSucceeds(setDoc(doc(owner, 'users', CLIN), { id: CLIN, clinic_id: OWNER, role: 'clinician', name: 'C1' })));
await check('owner adds clinician 2', assertSucceeds(setDoc(doc(owner, 'users', CLIN2), { id: CLIN2, clinic_id: OWNER, role: 'clinician', name: 'C2' })));
await check('owner adds coordinator', assertSucceeds(setDoc(doc(owner, 'users', COORD), { id: COORD, clinic_id: OWNER, role: 'front_desk', name: 'Co' })));
await check('owner cannot add another owner', assertFails(setDoc(doc(owner, 'users', 'x1'), { id: 'x1', clinic_id: OWNER, role: 'owner' })));
await check('clinician cannot add staff', assertFails(setDoc(doc(clin, 'users', 'x2'), { id: 'x2', clinic_id: OWNER, role: 'clinician' })));
await check('clinician cannot promote self to owner', assertFails(updateDoc(doc(clin, 'users', CLIN), { role: 'owner' })));
await check('owner cannot change staff role field', assertFails(updateDoc(doc(owner, 'users', CLIN), { role: 'owner' })));
await check('members can list clinic roster', assertSucceeds(getDocs(query(collection(clin, 'users'), where('clinic_id', '==', OWNER)))));
await check('other clinic cannot list roster', assertFails(getDocs(query(collection(other, 'users'), where('clinic_id', '==', OWNER)))));
await check('other clinic cannot read clinic doc', assertFails(getDoc(doc(other, 'clinics', OWNER))));

await check('existing staff cannot spin up their own clinic', assertFails(setDoc(doc(clin, 'clinics', CLIN), { id: CLIN, name: 'escape' })));

// --- Clients
const client = (id, assigned) => ({ id, clinic_id: OWNER, name: id, assigned_clinician_id: assigned, status: 'active', consent_status: 'granted', created_at: '2026-10-01' });
await check('coordinator creates client', assertSucceeds(setDoc(doc(coord, 'clients', 'c1'), client('c1', CLIN))));
await check('owner creates client', assertSucceeds(setDoc(doc(owner, 'clients', 'c2'), client('c2', CLIN2))));
await check('clinician cannot create client', assertFails(setDoc(doc(clin, 'clients', 'c3'), client('c3', CLIN))));
await check('client must be assigned to a clinician of this clinic', assertFails(setDoc(doc(owner, 'clients', 'c4'), client('c4', OTHER_OWNER))));
await check('clinician reads assigned client', assertSucceeds(getDoc(doc(clin, 'clients', 'c1'))));
await check('clinician cannot read other caseload client', assertFails(getDoc(doc(clin, 'clients', 'c2'))));
await check('clinician lists own caseload', assertSucceeds(getDocs(query(collection(clin, 'clients'), where('clinic_id', '==', OWNER), where('assigned_clinician_id', '==', CLIN)))));
await check('clinician cannot list whole clinic', assertFails(getDocs(query(collection(clin, 'clients'), where('clinic_id', '==', OWNER)))));
await check('coordinator lists whole clinic', assertSucceeds(getDocs(query(collection(coord, 'clients'), where('clinic_id', '==', OWNER)))));
await check('other clinic cannot list clients', assertFails(getDocs(query(collection(other, 'clients'), where('clinic_id', '==', OWNER)))));
await check('coordinator cannot reassign client', assertFails(updateDoc(doc(coord, 'clients', 'c1'), { assigned_clinician_id: CLIN2 })));
await check('coordinator cannot anonymize (erasure is owner-only)', assertFails(updateDoc(doc(coord, 'clients', 'c1'), { anonymized: true })));
await check('nobody can delete a client', assertFails(deleteDoc(doc(owner, 'clients', 'c1'))));

// --- Session notes
const note = (id, clientId, assigned, by) => ({ id, clinic_id: OWNER, client_id: clientId, assigned_clinician_id: assigned, clinician_id: by, status: 'draft', content: { subjective: 'x' }, addenda: [], created_at: '2026-10-07T10:00:00Z', updated_at: '2026-10-07T10:00:00Z' });
await check('clinician writes note for own client', assertSucceeds(setDoc(doc(clin, 'session_notes', 'n1'), note('n1', 'c1', CLIN, CLIN))));
await check('clinician cannot write note for other caseload', assertFails(setDoc(doc(clin, 'session_notes', 'n2'), note('n2', 'c2', CLIN2, CLIN))));
await check('clinician cannot fake assignment on note', assertFails(setDoc(doc(clin, 'session_notes', 'n3'), note('n3', 'c2', CLIN, CLIN))));
await check('coordinator cannot write notes', assertFails(setDoc(doc(coord, 'session_notes', 'n4'), note('n4', 'c1', CLIN, COORD))));
await check('owner writes note on any client', assertSucceeds(setDoc(doc(owner, 'session_notes', 'n5'), note('n5', 'c2', CLIN2, OWNER))));
await check('assigned clinician reads owner-written note', assertSucceeds(getDoc(doc(clin2, 'session_notes', 'n5'))));
await check('other clinician cannot read note', assertFails(getDoc(doc(clin2, 'session_notes', 'n1'))));
await check('coordinator cannot read notes', assertFails(getDoc(doc(coord, 'session_notes', 'n1'))));
await check('coordinator cannot list notes', assertFails(getDocs(query(collection(coord, 'session_notes'), where('clinic_id', '==', OWNER)))));
await check('clinician lists own notes by assignment', assertSucceeds(getDocs(query(collection(clin, 'session_notes'), where('clinic_id', '==', OWNER), where('assigned_clinician_id', '==', CLIN)))));
await check('clinician cannot list all clinic notes', assertFails(getDocs(query(collection(clin, 'session_notes'), where('clinic_id', '==', OWNER)))));
await check('owner lists all clinic notes', assertSucceeds(getDocs(query(collection(owner, 'session_notes'), where('clinic_id', '==', OWNER)))));
await check('edit draft', assertSucceeds(updateDoc(doc(clin, 'session_notes', 'n1'), { content: { subjective: 'edited' }, updated_at: 'now' })));
await check('cannot move note to another client', assertFails(updateDoc(doc(clin, 'session_notes', 'n1'), { client_id: 'c2' })));
await check('cannot sign on behalf of someone else', assertFails(updateDoc(doc(clin, 'session_notes', 'n1'), { status: 'signed', signed_by_id: OWNER })));
await check('sign note', assertSucceeds(updateDoc(doc(clin, 'session_notes', 'n1'), { status: 'signed', signed_by_id: CLIN, signed_at: 'x', signature_hash: 'h' })));
await check('signed note content is locked', assertFails(updateDoc(doc(clin, 'session_notes', 'n1'), { content: { subjective: 'tamper' } })));
await check('signed note cannot be un-signed', assertFails(updateDoc(doc(clin, 'session_notes', 'n1'), { status: 'draft' })));
await check('owner cannot alter signed note either', assertFails(updateDoc(doc(owner, 'session_notes', 'n1'), { private_notes: 'x' })));
await check('append addendum to signed note', assertSucceeds(updateDoc(doc(clin, 'session_notes', 'n1'), { addenda: arrayUnion({ id: 'a1', text: 't', added_by: 'C1', added_at: 'x' }), updated_at: 'n' })));
await check('cannot remove addenda', assertFails(updateDoc(doc(clin, 'session_notes', 'n1'), { addenda: [], updated_at: 'n2' })));
await check('nobody can delete notes', assertFails(deleteDoc(doc(owner, 'session_notes', 'n1'))));

// --- Assessments
const tokenA = 'a'.repeat(48);
const tokenB = 'b'.repeat(48);
const tokenC = 'c'.repeat(48);
const assess = (token, type, expiresMs) => ({
  id: token, secure_link_token: token, clinic_id: OWNER, client_id: 'c1', assigned_clinician_id: CLIN, clinician_id: CLIN,
  type, status: 'pending', sent_at: '2026-10-07T10:00:00Z', expires_at: new Date(expiresMs).toISOString(), expires_at_ms: expiresMs,
  client_first_name: 'c1', clinic_name: 'Mentra',
});
const week = Date.now() + 7 * 864e5;
await check('clinician issues assessment', assertSucceeds(setDoc(doc(clin, 'assessments', tokenA), assess(tokenA, 'PHQ9', week))));
await check('short tokens rejected', assertFails(setDoc(doc(clin, 'assessments', 'short'), assess('short', 'PHQ9', week))));
await check('coordinator cannot issue assessment', assertFails(setDoc(doc(coord, 'assessments', tokenB), { ...assess(tokenB, 'PHQ9', week), clinician_id: COORD })));
await check('client opens pending link without login', assertSucceeds(getDoc(doc(anon, 'assessments', tokenA))));
await check('anonymous cannot list assessments', assertFails(getDocs(query(collection(anon, 'assessments'), where('clinic_id', '==', OWNER)))));
await check('anonymous cannot tamper metadata', assertFails(updateDoc(doc(anon, 'assessments', tokenA), { client_id: 'c2', status: 'completed' })));
const responses9 = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => [String(i), 1]));
await check('incomplete answer set rejected', assertFails(updateDoc(doc(anon, 'assessments', tokenA), { responses: { 1: 1 }, score: 1, severity_band: 'Minimal', status: 'completed', completed_at: 'x', completed_at_iso: 'x' })));
await check('out-of-range score rejected', assertFails(updateDoc(doc(anon, 'assessments', tokenA), { responses: responses9, score: 99, severity_band: 'Severe', status: 'completed', completed_at: 'x', completed_at_iso: 'x' })));
await check('client submits answers', assertSucceeds(updateDoc(doc(anon, 'assessments', tokenA), { responses: responses9, score: 9, severity_band: 'Mild', status: 'completed', completed_at: 'x', completed_at_iso: 'x' })));
await check('cannot resubmit completed link', assertFails(updateDoc(doc(anon, 'assessments', tokenA), { responses: responses9, score: 0, severity_band: 'Minimal', status: 'completed', completed_at: 'y', completed_at_iso: 'y' })));
await check('completed answers not readable via link', assertFails(getDoc(doc(anon, 'assessments', tokenA))));
await check('assigned clinician reads completed result', assertSucceeds(getDoc(doc(clin, 'assessments', tokenA))));
await check('other clinician cannot read result', assertFails(getDoc(doc(clin2, 'assessments', tokenA))));
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'assessments', tokenC), assess(tokenC, 'GAD7', Date.now() - 1000));
});
const responses7 = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((i) => [String(i), 0]));
await check('expired link cannot be submitted', assertFails(updateDoc(doc(anon, 'assessments', tokenC), { responses: responses7, score: 0, severity_band: 'Minimal', status: 'completed', completed_at: 'x', completed_at_iso: 'x' })));

// --- Consent, audit, DPDP
await check('consent record append', assertSucceeds(setDoc(doc(coord, 'consent_records', 'r1'), { id: 'r1', clinic_id: OWNER, client_id: 'c1', status: 'granted' })));
await check('consent records immutable', assertFails(updateDoc(doc(owner, 'consent_records', 'r1'), { status: 'withdrawn' })));
await check('audit log write', assertSucceeds(setDoc(doc(clin, 'audit_logs', 'l1'), { id: 'l1', clinic_id: OWNER, actor_id: CLIN, action: 'X' })));
await check('audit log cannot impersonate actor', assertFails(setDoc(doc(clin, 'audit_logs', 'l2'), { id: 'l2', clinic_id: OWNER, actor_id: OWNER, action: 'X' })));
await check('audit log undeletable', assertFails(deleteDoc(doc(owner, 'audit_logs', 'l1'))));
await check('clinician cannot read audit log', assertFails(getDoc(doc(clin, 'audit_logs', 'l1'))));
await check('dpdp request recorded by coordinator', assertSucceeds(setDoc(doc(coord, 'dpdp_requests', 'd1'), { id: 'd1', clinic_id: OWNER, status: 'pending', type: 'export' })));
await check('only owner reads dpdp requests', assertFails(getDoc(doc(coord, 'dpdp_requests', 'd1'))));

// --- Staff removal
await check('founding owner cannot be removed', assertFails(deleteDoc(doc(owner, 'users', OWNER))));
await check('owner removes clinician', assertSucceeds(deleteDoc(doc(owner, 'users', CLIN2))));
await check('removed clinician loses access', assertFails(getDoc(doc(clin2, 'session_notes', 'n5'))));

await env.cleanup();
const failed = results.filter((r) => r[0] === 'FAIL');
for (const r of results) console.log(r.join(' | '));
console.log(`\n${results.length - failed.length}/${results.length} rule checks passed`);
process.exit(failed.length ? 1 : 0);
