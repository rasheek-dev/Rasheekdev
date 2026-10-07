// Checks psychologists.js -> MindLedger accounts and the returning-client assign flow.
// Run against a fresh MindLedger database, with psychologists.js placed in the web root:
//   node scripts/website-sync-test.mjs <api url> <web root folder>
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const [API, ROOT] = process.argv.slice(2);
if (!API || !ROOT) throw new Error('Usage: node scripts/website-sync-test.mjs <api url> <web root>');
const psyFile = join(ROOT, 'psychologists.js');
copyFileSync(new URL('../psychologists.js', import.meta.url), psyFile);

async function call(token, method, path, body) {
  const res = await fetch(`${API}?path=${encodeURIComponent(path)}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Auth-Token': token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, ...(await res.json()) };
}
const results = [];
const check = (name, ok, info = '') => results.push([ok ? 'PASS' : 'FAIL', name, ok ? '' : info]);

const owner = (await call(null, 'POST', 'auth/setup', { clinic_name: 'Mentra', owner_name: 'Mentra Owner', email: 'care@mentracare.in', password: 'Owner12345' })).token;
let d = await call(owner, 'GET', 'data');
const web = d.users.filter((u) => u.from_website);
check('every active website psychologist gets an account', web.length === 4, JSON.stringify(web.map((u) => u.name)));
const anjali = web.find((u) => u.website_id === 'psy_counselling_01');
const rahul = web.find((u) => u.website_id === 'psy_clinical_01');
check('login email made from the name', anjali?.email === 'anjali.nair@psychologist.mentracare.in', anjali?.email);
check('accounts wait for a password', web.every((u) => u.needs_password && u.role === 'clinician'));
check('title, photo and registration synced', anjali?.title === 'Counselling Psychologist' && anjali?.avatar_url === '/assets/psychologist_female.jpg');
check('no duplicates on reload', (await call(owner, 'GET', 'data')).users.filter((u) => u.from_website).length === 4);

let js = readFileSync(psyFile, 'utf8');
js = js.replace('name: "Anjali Nair, M.Sc.",', 'name: "Anjali Nair, M.Sc.",\n    email: "anjali@mentracare.in",');
js = js.replace('window.MENTRA_PSYCHOLOGISTS = [', `window.MENTRA_PSYCHOLOGISTS = [
  { id: "psy_new_01", active: true, name: "Dr. Sana Thomas", title: "Clinical Psychologist" },
  { id: "psy_hidden_01", active: false, name: "Hidden Person" },`);
writeFileSync(psyFile, js);
d = await call(owner, 'GET', 'data');
check('email added in psychologists.js becomes the login', d.users.find((u) => u.id === anjali.id)?.email === 'anjali@mentracare.in');
check('new psychologist in the file gets an account', d.users.some((u) => u.name === 'Dr. Sana Thomas'));
check('inactive psychologist is not added', !d.users.some((u) => u.name === 'Hidden Person'));

// Returning client
await call(owner, 'POST', 'staff', { name: 'Desk', email: 'desk@t.test', password: 'Desk12345', role: 'front_desk' });
const desk = (await call(null, 'POST', 'auth/login', { email: 'desk@t.test', password: 'Desk12345' })).token;
await call(owner, 'POST', `staff/${anjali.id}/password`, { password: 'Anjali1234' });
await call(owner, 'POST', `staff/${rahul.id}/password`, { password: 'Rahul12345' });
const anj = (await call(null, 'POST', 'auth/login', { email: 'anjali@mentracare.in', password: 'Anjali1234' })).token;
const rah = (await call(null, 'POST', 'auth/login', { email: rahul.email, password: 'Rahul12345' })).token;

const ravi = (await call(desk, 'POST', 'clients', { name: 'Ravi Kumar', phone: '+91 98765 43210', assigned_clinician_id: anjali.id, consent_status: 'granted' })).client;
const n1 = (await call(anj, 'POST', 'notes', { client_id: ravi.id, content: { assessment: 'First visit report' } })).note;
await call(anj, 'POST', `notes/${n1.id}/sign`, {});
const deskData = await call(desk, 'GET', 'data');
check('front desk sees report count, not contents', deskData.clients[0].reports_count === 1 && deskData.notes.length === 0);
check('clinician cannot reassign clients', !(await call(anj, 'POST', `clients/${ravi.id}/assign`, { assigned_clinician_id: anjali.id })).ok);
check('must pick a real psychologist', !(await call(desk, 'POST', `clients/${ravi.id}/assign`, { assigned_clinician_id: 'nobody' })).ok);
const assigned = await call(desk, 'POST', `clients/${ravi.id}/assign`, { assigned_clinician_id: rahul.id });
check('front desk assigns returning client to another psychologist', assigned.ok && assigned.client.assigned_clinician_id === rahul.id);
const rd = await call(rah, 'GET', 'data');
check('new psychologist sees the client', rd.clients.some((c) => c.id === ravi.id));
check('new psychologist sees previous report', rd.notes.some((n) => n.id === n1.id && n.status === 'signed'));
check('new psychologist adds a new report', (await call(rah, 'POST', 'notes', { client_id: ravi.id, content: { assessment: 'Follow-up report' } })).ok);
const ad = await call(anj, 'GET', 'data');
check('previous psychologist keeps only her own report', ad.notes.some((n) => n.id === n1.id) && !ad.clients.some((c) => c.id === ravi.id));
const od = await call(owner, 'GET', 'data');
check('owner sees both reports', od.notes.filter((n) => n.client_id === ravi.id).length === 2 && od.clients.find((c) => c.id === ravi.id).reports_count === 2);
check('assign back to the same psychologist works', (await call(owner, 'POST', `clients/${ravi.id}/assign`, { assigned_clinician_id: rahul.id })).ok);

// Session booking
const day = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
const book = (token, body) => call(token, 'POST', 'sessions', { mode: 'in_person', duration_minutes: 50, date: day, ...body });
const s1 = await book(desk, { client_id: ravi.id, clinician_id: anjali.id, start_time: '10:00', notes: 'Follow-up' });
check('front desk books returning client with a date and time', s1.ok && s1.session.end_time === '10:50' && s1.session.status === 'confirmed', JSON.stringify(s1));
check('booking with another psychologist moves the file', s1.client?.assigned_clinician_id === anjali.id);
check('psychologist sees the booked session and earlier reports', (await call(anj, 'GET', 'data')).sessions.some((s) => s.id === s1.session?.id) && (await call(anj, 'GET', 'data')).notes.length === 2);
const priya = (await call(desk, 'POST', 'clients', { name: 'Priya S', phone: '+91 90000 11111', assigned_clinician_id: anjali.id, consent_status: 'granted' })).client;
const clash = await book(desk, { client_id: priya.id, clinician_id: anjali.id, start_time: '10:30' });
check('double booking the same psychologist is refused', clash.status === 409 && clash.code === 'conflict', JSON.stringify(clash));
check('back-to-back slot is allowed', (await book(desk, { client_id: priya.id, clinician_id: anjali.id, start_time: '10:50' })).ok);
check('bad time refused', (await book(desk, { client_id: priya.id, clinician_id: anjali.id, start_time: '25:00' })).status === 400);
check('session past midnight refused', (await book(desk, { client_id: priya.id, clinician_id: anjali.id, start_time: '23:30', duration_minutes: 60 })).status === 400);
check('psychologist cannot book for another psychologist', (await book(anj, { client_id: priya.id, clinician_id: rahul.id, start_time: '15:00' })).status === 403);
check('psychologist can book own client with self', (await book(anj, { client_id: priya.id, clinician_id: anjali.id, start_time: '16:00' })).ok);
check('psychologist cannot book a client outside caseload', !(await book(rah, { client_id: priya.id, clinician_id: rahul.id, start_time: '16:00' })).ok);
const note2 = await call(anj, 'POST', 'notes', { client_id: ravi.id, appointment_id: s1.session.id, content: { assessment: 'Session report' } });
check('report written against the booked session', note2.ok && note2.note.appointment_id === s1.session.id);
check('front desk marks a session no-show', (await call(desk, 'PATCH', `sessions/${s1.session.id}`, { status: 'no_show' })).ok);
check('other psychologist cannot change the session', (await call(rah, 'PATCH', `sessions/${s1.session.id}`, { status: 'cancelled' })).status === 404);
check('psychologist marks session completed', (await call(anj, 'PATCH', `sessions/${s1.session.id}`, { status: 'completed' })).session?.status === 'completed');
await call(desk, 'PATCH', `sessions/${s1.session.id}`, { status: 'cancelled' });
check('cancelled slot can be booked again', (await book(desk, { client_id: priya.id, clinician_id: anjali.id, start_time: '10:00', duration_minutes: 45 })).ok);
check('unknown status refused', (await call(desk, 'PATCH', `sessions/${s1.session.id}`, { status: 'paid' })).status === 400);

await call(owner, 'POST', `clients/${ravi.id}/erase`, {});
check('erased client cannot be booked', !(await book(desk, { client_id: ravi.id, clinician_id: anjali.id, start_time: '18:00' })).ok);
check('erased client cannot be reused', !(await call(desk, 'POST', `clients/${ravi.id}/assign`, { assigned_clinician_id: anjali.id })).ok);
check('website booking endpoint is gone', (await call(null, 'POST', 'public/website-booking', { proId: 'x' })).status === 404);

const failed = results.filter((r) => r[0] === 'FAIL');
for (const r of results) console.log(r.filter(Boolean).join(' | '));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
