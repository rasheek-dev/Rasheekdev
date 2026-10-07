// Checks the Mentra website -> MindLedger sync against a fresh database that has the
// Mentra schema loaded (database/schema.sql). Needs the mysql CLI for seeding.
//   node scripts/website-sync-test.mjs <api url> <database name>
import { execFileSync } from 'node:child_process';

const [API, DB] = process.argv.slice(2);
if (!API || !DB) throw new Error('Usage: node scripts/website-sync-test.mjs <api url> <database>');

const sql = (q) => execFileSync('mysql', ['-uroot', DB, '-N', '-e', q], { encoding: 'utf8' });
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
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

// Website data: two psychologists (one without email) and a confirmed booking.
sql(`INSERT INTO psychologists (id, slug, name, email, phone, photo_url, registration_number) VALUES
  (1, 'dr-asha', 'Dr. Asha Rao', 'asha@mentracare.in', '9800000001', 'assets/asha.jpg', 'RCI-A1'),
  (2, 'dr-vikram', 'Dr. Vikram Iyer', NULL, '9800000002', NULL, 'RCI-V2')`);
sql(`INSERT INTO bookings (id, booking_code, psychologist_id, slot_date, start_time, end_time, client_name, client_email, client_phone, client_age, client_concerns, amount, payment_status, booking_status, google_meet_url) VALUES
  (1, 'MNT-0001', 1, '${day(1)}', '10:00:00', '11:00:00', 'Ravi Kumar', 'ravi@example.com', '+91 98765 43210', 29, 'Low mood after job loss', 999, 'completed', 'confirmed', 'https://meet.google.com/abc-defg-hij'),
  (2, 'MNT-0002', 1, '${day(2)}', '12:00:00', '13:00:00', 'Priya Shah', 'priya@example.com', '9123456789', 16, 'Exam anxiety', 999, 'pending', 'pending', NULL)`);

const setup = await call(null, 'POST', 'auth/setup', { clinic_name: 'Mentra', owner_name: 'Mentra Owner', email: 'care@mentracare.in', password: 'Owner12345' });
const owner = setup.token;
let d = await call(owner, 'GET', 'data');
check('website linked', d.websiteLinked === true);
const asha = d.users.find((u) => u.name === 'Dr. Asha Rao');
const vikram = d.users.find((u) => u.name === 'Dr. Vikram Iyer');
check('psychologists become MindLedger psychologists', asha?.role === 'clinician' && vikram?.role === 'clinician', JSON.stringify(d.users.map((u) => u.name)));
check('website email used as login', asha?.email === 'asha@mentracare.in', asha?.email);
check('psychologist without email gets a login address', /@psychologist\.mentracare\.in$/.test(vikram?.email || ''), vikram?.email);
check('new accounts flagged as needing a password', asha?.needs_password === true && asha?.from_website === true);
check('profile synced (phone, licence, photo)', asha?.phone === '9800000001' && asha?.license_number === 'RCI-A1' && asha?.avatar_url === '/assets/asha.jpg', JSON.stringify(asha));
check('only the paid booking created a client', d.clients.length === 1 && d.clients[0].name === 'Ravi Kumar', JSON.stringify(d.clients.map((c) => c.name)));
const ravi = d.clients[0];
check('client assigned to booked psychologist', ravi.assigned_clinician_id === asha.id);
check('client details from booking', ravi.source === 'website' && ravi.age_at_intake === 29 && ravi.intake_concerns === 'Low mood after job loss' && ravi.consent_status === 'pending');
check('session created from booking', d.sessions.length === 1 && d.sessions[0].booking_code === 'MNT-0001' && d.sessions[0].meet_url.includes('meet.google.com'));
const loginBefore = await call(null, 'POST', 'auth/login', { email: 'asha@mentracare.in', password: 'anything123' });
check('website psychologist cannot sign in before a password is set', !loginBefore.ok);

d = await call(owner, 'GET', 'data');
check('sync is idempotent (no duplicates on reload)', d.users.length === 3 && d.clients.length === 1 && d.sessions.length === 1, `${d.users.length}/${d.clients.length}/${d.sessions.length}`);

await call(owner, 'POST', `staff/${asha.id}/password`, { password: 'Asha12345' });
const ashaTok = (await call(null, 'POST', 'auth/login', { email: 'asha@mentracare.in', password: 'Asha12345' })).token;
check('psychologist signs in after owner sets password', Boolean(ashaTok));
let ad = await call(ashaTok, 'GET', 'data');
check('psychologist sees her booked client and session', ad.clients.length === 1 && ad.sessions.length === 1);
check('needs_password cleared', (await call(owner, 'GET', 'data')).users.find((u) => u.id === asha.id).needs_password === undefined);

const note = await call(ashaTok, 'POST', 'notes', { client_id: ravi.id, appointment_id: ad.sessions[0].id, template_type: 'SOAP', content: { assessment: 'First session report' } });
check('report linked to the website session', note.note?.appointment_id === 'mb-1', JSON.stringify(note));
await call(ashaTok, 'POST', `notes/${note.note.id}/sign`, {});

// Follow-up: Ravi books again with Dr. Vikram (different phone format), and Priya pays.
sql(`INSERT INTO bookings (id, booking_code, psychologist_id, slot_date, start_time, end_time, client_name, client_email, client_phone, client_age, amount, payment_status, booking_status) VALUES
  (3, 'MNT-0003', 2, '${day(8)}', '09:00:00', '10:00:00', 'Ravi K', NULL, '9876543210', 29, 999, 'completed', 'confirmed')`);
sql(`UPDATE bookings SET payment_status = 'completed', booking_status = 'confirmed', updated_at = NOW() + INTERVAL 1 SECOND WHERE id = 2`);
d = await call(owner, 'GET', 'data');
const raviNow = d.clients.find((c) => c.id === ravi.id);
check('follow-up matched to existing client (no duplicate file)', d.clients.filter((c) => c.name.startsWith('Ravi')).length === 1);
check('follow-up session added to the same file', d.sessions.filter((s) => s.client_id === ravi.id).length === 2);
check('client moves to the follow-up psychologist', raviNow.assigned_clinician_id === vikram.id);
const priya = d.clients.find((c) => c.name === 'Priya Shah');
check('booking that becomes paid later is picked up', Boolean(priya) && priya.assigned_clinician_id === asha.id);
check('under-18 booking marked as minor', priya?.is_minor === true);

await call(owner, 'POST', `staff/${vikram.id}/password`, { password: 'Vikram1234' });
const vikTok = (await call(null, 'POST', 'auth/login', { email: vikram.email, password: 'Vikram1234' })).token;
const vd = await call(vikTok, 'GET', 'data');
check('new psychologist sees the client', vd.clients.some((c) => c.id === ravi.id));
check('new psychologist sees the earlier report', vd.notes.some((n) => n.id === note.note.id && n.status === 'signed'));
const vNote = await call(vikTok, 'POST', 'notes', { client_id: ravi.id, appointment_id: 'mb-3', content: { assessment: 'Follow-up report' } });
check('new psychologist adds a new report', vNote.ok === true && vNote.note.appointment_id === 'mb-3');
ad = await call(ashaTok, 'GET', 'data');
check('previous psychologist keeps her own report', ad.notes.some((n) => n.id === note.note.id));
check('previous psychologist no longer sees the moved client file', !ad.clients.some((c) => c.id === ravi.id));
check('previous psychologist still sees her other client', ad.clients.some((c) => c.name === 'Priya Shah'));

// Cancellation
sql(`UPDATE bookings SET booking_status = 'cancelled', updated_at = NOW() + INTERVAL 2 SECOND WHERE id = 3`);
d = await call(owner, 'GET', 'data');
check('cancelled booking marks the session cancelled', d.sessions.find((s) => s.id === 'mb-3')?.status === 'cancelled');

// Website edits flow through; MindLedger removal is respected.
sql(`UPDATE psychologists SET email = 'vikram@mentracare.in', phone = '9800000099' WHERE id = 2`);
d = await call(owner, 'GET', 'data');
const vikNow = d.users.find((u) => u.id === vikram.id);
check('website email/phone changes are applied', vikNow.email === 'vikram@mentracare.in' && vikNow.phone === '9800000099', JSON.stringify(vikNow));
await call(owner, 'POST', `staff/${asha.id}/remove`, {});
d = await call(owner, 'GET', 'data');
check('a psychologist removed in MindLedger stays removed', !d.users.some((u) => u.id === asha.id));

const failed = results.filter((r) => r[0] === 'FAIL');
for (const r of results) console.log(r.filter(Boolean).join(' | '));
console.log(`\n${results.length - failed.length}/${results.length} website sync checks passed`);
process.exit(failed.length ? 1 : 0);
