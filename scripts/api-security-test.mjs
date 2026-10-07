// Permission checks for the MindLedger PHP API. Run against a fresh database:
//   node scripts/api-security-test.mjs http://localhost/mindledger/api/index.php
const API = process.argv[2];
if (!API) throw new Error('Usage: node scripts/api-security-test.mjs <api url>');

async function call(token, method, path, body) {
  const res = await fetch(`${API}?path=${encodeURIComponent(path)}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Auth-Token': token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, ...data };
}

const results = [];
async function expectOk(name, p) {
  const r = await p;
  results.push([r.ok ? 'PASS' : 'FAIL', name, r.ok ? '' : `${r.status} ${r.error}`]);
  return r;
}
async function expectDenied(name, p) {
  const r = await p;
  results.push([!r.ok ? 'PASS' : 'FAIL', name, r.ok ? 'request unexpectedly succeeded' : '']);
  return r;
}

// Setup & login
const setup = await expectOk('first-run setup creates owner', call(null, 'POST', 'auth/setup', { clinic_name: 'Mentra Care', owner_name: 'Dr. Owner', email: 'owner@t.test', password: 'Owner1234' }));
const owner = setup.token;
await expectDenied('setup cannot run a second time', call(null, 'POST', 'auth/setup', { clinic_name: 'Evil', owner_name: 'X', email: 'x@t.test', password: 'Evil12345' }));
await expectDenied('no data without login', call(null, 'GET', 'data'));
await expectDenied('forged token rejected', call('a'.repeat(64), 'GET', 'data'));
await expectDenied('wrong password rejected', call(null, 'POST', 'auth/login', { email: 'owner@t.test', password: 'nope' }));

// Staff
const c1 = await expectOk('owner adds clinician 1', call(owner, 'POST', 'staff', { name: 'Clin One', email: 'c1@t.test', password: 'Clin12345', role: 'clinician' }));
const c2 = await expectOk('owner adds clinician 2', call(owner, 'POST', 'staff', { name: 'Clin Two', email: 'c2@t.test', password: 'Clin12345', role: 'clinician' }));
await expectOk('owner adds coordinator', call(owner, 'POST', 'staff', { name: 'Desk', email: 'd@t.test', password: 'Desk12345', role: 'front_desk' }));
await expectDenied('owner cannot add another owner', call(owner, 'POST', 'staff', { name: 'O2', email: 'o2@t.test', password: 'Owner1234', role: 'owner' }));
await expectDenied('duplicate email rejected', call(owner, 'POST', 'staff', { name: 'Dup', email: 'c1@t.test', password: 'Clin12345', role: 'clinician' }));
await expectDenied('short password rejected', call(owner, 'POST', 'staff', { name: 'S', email: 's@t.test', password: 'short', role: 'clinician' }));
const clin1 = (await call(null, 'POST', 'auth/login', { email: 'c1@t.test', password: 'Clin12345' })).token;
const clin2 = (await call(null, 'POST', 'auth/login', { email: 'c2@t.test', password: 'Clin12345' })).token;
const desk = (await call(null, 'POST', 'auth/login', { email: 'd@t.test', password: 'Desk12345' })).token;
await expectDenied('clinician cannot add staff', call(clin1, 'POST', 'staff', { name: 'X', email: 'x2@t.test', password: 'Clin12345', role: 'clinician' }));
await expectDenied('coordinator cannot change clinic', call(desk, 'PATCH', 'clinic', { name: 'Hacked' }));

// Clients
const cl1 = await expectOk('coordinator creates client for clinician 1', call(desk, 'POST', 'clients', { name: 'Client A', phone: '9876543210', email: 'a@x.test', assigned_clinician_id: c1.user.id, consent_status: 'granted' }));
const cl2 = await expectOk('owner creates client for clinician 2', call(owner, 'POST', 'clients', { name: 'Client B', phone: '9876500000', email: 'b@x.test', assigned_clinician_id: c2.user.id, consent_status: 'granted' }));
await expectDenied('clinician cannot create clients', call(clin1, 'POST', 'clients', { name: 'X', assigned_clinician_id: c1.user.id }));
await expectDenied('client must be assigned to a clinician', call(owner, 'POST', 'clients', { name: 'X', assigned_clinician_id: 'nobody' }));
const c1data = await call(clin1, 'GET', 'data');
results.push([c1data.clients.length === 1 && c1data.clients[0].name === 'Client A' ? 'PASS' : 'FAIL', 'clinician 1 sees only own caseload', JSON.stringify(c1data.clients.map((c) => c.name))]);
const deskData = await call(desk, 'GET', 'data');
results.push([deskData.clients.length === 2 && deskData.notes.length === 0 && deskData.assessments.length === 0 ? 'PASS' : 'FAIL', 'coordinator sees all clients but no clinical data', '']);
results.push([deskData.users.every((u) => !('password_hash' in u)) ? 'PASS' : 'FAIL', 'password hashes never sent to browser', '']);

// Notes
const n1 = await expectOk('clinician 1 writes note for own client', call(clin1, 'POST', 'notes', { client_id: cl1.client.id, template_type: 'SOAP', content: { subjective: 'x' } }));
await expectDenied('clinician 1 cannot write note for other caseload', call(clin1, 'POST', 'notes', { client_id: cl2.client.id, content: {} }));
await expectDenied('coordinator cannot write notes', call(desk, 'POST', 'notes', { client_id: cl1.client.id, content: {} }));
await expectDenied('clinician 2 cannot edit clinician 1 note', call(clin2, 'PATCH', `notes/${n1.note.id}`, { content: { subjective: 'tamper' } }));
await expectDenied('coordinator cannot edit notes', call(desk, 'PATCH', `notes/${n1.note.id}`, { content: { subjective: 'tamper' } }));
await expectOk('edit own draft', call(clin1, 'PATCH', `notes/${n1.note.id}`, { content: { subjective: 'edited' } }));
await expectDenied('clinician 2 cannot sign it', call(clin2, 'POST', `notes/${n1.note.id}/sign`, {}));
const signed = await expectOk('sign note', call(clin1, 'POST', `notes/${n1.note.id}/sign`, {}));
results.push([/^SHA256:[a-f0-9]{32}$/.test(signed.note.signature_hash) ? 'PASS' : 'FAIL', 'server computes signature hash', signed.note.signature_hash]);
await expectDenied('signed note locked against edits', call(clin1, 'PATCH', `notes/${n1.note.id}`, { content: { subjective: 'tamper' } }));
await expectDenied('owner cannot edit signed note either', call(owner, 'PATCH', `notes/${n1.note.id}`, { private_notes: 'x' }));
await expectDenied('cannot sign twice', call(clin1, 'POST', `notes/${n1.note.id}/sign`, {}));
await expectOk('addendum on signed note', call(clin1, 'POST', `notes/${n1.note.id}/addenda`, { text: 'Called client.' }));
await expectDenied('empty addendum rejected', call(clin1, 'POST', `notes/${n1.note.id}/addenda`, { text: '  ' }));
const ownerData = await call(owner, 'GET', 'data');
results.push([ownerData.notes.length === 1 && ownerData.notes[0].addenda.length === 1 && ownerData.notes[0].content.subjective === 'edited' ? 'PASS' : 'FAIL', 'owner sees signed note with addendum, content unchanged', '']);

// Assessments
const a1 = await expectOk('clinician issues PHQ-9', call(clin1, 'POST', 'assessments', { client_id: cl1.client.id, type: 'PHQ9' }));
await expectDenied('coordinator cannot issue assessments', call(desk, 'POST', 'assessments', { client_id: cl1.client.id, type: 'PHQ9' }));
await expectDenied('clinician cannot issue for other caseload', call(clin1, 'POST', 'assessments', { client_id: cl2.client.id, type: 'PHQ9' }));
await expectDenied('unknown type rejected', call(clin1, 'POST', 'assessments', { client_id: cl1.client.id, type: 'XYZ' }));
const token = a1.assessment.secure_link_token;
const pub = await expectOk('client opens link without login', call(null, 'GET', `public/assessment/${token}`));
results.push([pub.client_first_name === 'Client' && !('client_id' in pub) && !('responses' in pub) ? 'PASS' : 'FAIL', 'public link reveals only first name and clinic', JSON.stringify(pub)]);
await expectDenied('incomplete answers rejected', call(null, 'POST', `public/assessment/${token}`, { responses: { 1: 1 } }));
await expectDenied('out-of-range answer rejected', call(null, 'POST', `public/assessment/${token}`, { responses: { 1: 9, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 } }));
const answers = { 1: 2, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 0, 9: 1 };
await expectOk('client submits answers', call(null, 'POST', `public/assessment/${token}`, { responses: answers }));
await expectDenied('link cannot be reused', call(null, 'POST', `public/assessment/${token}`, { responses: answers }));
await expectDenied('completed link no longer opens', call(null, 'GET', `public/assessment/${token}`));
await expectDenied('random token rejected', call(null, 'GET', `public/assessment/${'f'.repeat(48)}`));
const after = await call(clin1, 'GET', 'data');
const scored = after.assessments[0];
results.push([scored.score === 10 && scored.severity_band === 'Moderate' ? 'PASS' : 'FAIL', 'server scores PHQ-9 (10 = Moderate)', `${scored.score} ${scored.severity_band}`]);
const c2data = await call(clin2, 'GET', 'data');
results.push([c2data.assessments.length === 0 && c2data.notes.length === 0 ? 'PASS' : 'FAIL', 'clinician 2 sees none of clinician 1 records', '']);

// DPDP, consent, erasure
await expectOk('coordinator records DPDP request', call(desk, 'POST', 'dpdp', { client_contact: 'a@x.test', type: 'erasure', client_name: '' }));
await expectDenied('coordinator cannot erase client', call(desk, 'POST', `clients/${cl1.client.id}/erase`, {}));
await expectOk('clinician withdraws consent for own client', call(clin1, 'POST', `clients/${cl1.client.id}/consent-withdraw`, { purpose: 'Reminders', reason: 'asked' }));
await expectDenied('clinician cannot withdraw consent for other caseload', call(clin1, 'POST', `clients/${cl2.client.id}/consent-withdraw`, { purpose: 'X' }));
await expectOk('owner erases client', call(owner, 'POST', `clients/${cl1.client.id}/erase`, {}));
const erased = (await call(owner, 'GET', 'data'));
const ec = erased.clients.find((c) => c.id === cl1.client.id);
results.push([ec.anonymized && ec.email === 'redacted@dpdp.erased' && erased.dpdpRequests[0].status === 'completed' ? 'PASS' : 'FAIL', 'erasure redacts contact details and closes request', '']);

// Staff removal & passwords
await expectDenied('owner cannot remove self', call(owner, 'POST', `staff/${setup.user.id}/remove`, {}));
await expectOk('owner resets clinician 2 password', call(owner, 'POST', `staff/${c2.user.id}/password`, { password: 'NewPass123' }));
await expectDenied('old session ends after reset', call(clin2, 'GET', 'data'));
await expectOk('owner removes clinician 2', call(owner, 'POST', `staff/${c2.user.id}/remove`, {}));
await expectDenied('removed staff cannot sign in', call(null, 'POST', 'auth/login', { email: 'c2@t.test', password: 'NewPass123' }));
await expectDenied('change password needs current password', call(clin1, 'POST', 'auth/password', { current_password: 'wrong', new_password: 'Another123' }));
await expectOk('change own password', call(clin1, 'POST', 'auth/password', { current_password: 'Clin12345', new_password: 'Another123' }));
await expectOk('logout', call(clin1, 'POST', 'auth/logout', {}));
await expectDenied('token invalid after logout', call(clin1, 'GET', 'data'));

// Brute force
let last;
for (let i = 0; i < 12; i++) last = await call(null, 'POST', 'auth/login', { email: 'owner@t.test', password: `bad${i}` });
results.push([last.status === 429 ? 'PASS' : 'FAIL', 'sign-in rate limited after repeated failures', `${last.status}`]);

const failed = results.filter((r) => r[0] === 'FAIL');
for (const r of results) console.log(r.filter(Boolean).join(' | '));
console.log(`\n${results.length - failed.length}/${results.length} API checks passed`);
process.exit(failed.length ? 1 : 0);
