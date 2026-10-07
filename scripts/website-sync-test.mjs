// Checks the Mentra website -> MindLedger link: psychologists.js accounts and booking import.
// Run against a fresh MindLedger database, with psychologists.js placed in the web root:
//   node scripts/website-sync-test.mjs <api url> <web root folder>
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { join } from 'node:path';

const [API, ROOT] = process.argv.slice(2);
if (!API || !ROOT) throw new Error('Usage: node scripts/website-sync-test.mjs <api url> <web root>');
const psyFile = join(ROOT, 'psychologists.js');
const configFile = join(ROOT, 'mindledger', 'api', 'config.php');
copyFileSync(new URL('../psychologists.js', import.meta.url), psyFile);
const originalConfig = readFileSync(configFile, 'utf8');

async function call(token, method, path, body) {
  const res = await fetch(`${API}?path=${encodeURIComponent(path)}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Auth-Token': token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, ...(await res.json()) };
}
const book = (b) => call(null, 'POST', 'public/website-booking', b);
const results = [];
const check = (name, ok, info = '') => results.push([ok ? 'PASS' : 'FAIL', name, ok ? '' : info]);
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const booking = (over) => ({
  proId: 'psy_counselling_01', proName: 'Anjali Nair, M.Sc.', date: day(1), time: '10:00', durationMin: 45, mode: 'Online',
  name: 'Ravi Kumar', phone: '+919876543210', country: 'IN', email: 'ravi@example.com', ageRange: '25 to 34',
  ref: 'MNT-10001', paymentId: 'pay_abc', concerns: ['anxiety', 'overthinking'], who: 'self', ...over,
});

try {
  const setup = await call(null, 'POST', 'auth/setup', { clinic_name: 'Mentra', owner_name: 'Mentra Owner', email: 'care@mentracare.in', password: 'Owner12345' });
  const owner = setup.token;
  let d = await call(owner, 'GET', 'data');
  check('website linked via psychologists.js', d.websiteLinked === true);
  const web = d.users.filter((u) => u.from_website);
  check('every active website psychologist gets an account', web.length === 4, JSON.stringify(web.map((u) => u.name)));
  const anjali = web.find((u) => u.website_id === 'psy_counselling_01');
  const rahul = web.find((u) => u.website_id === 'psy_clinical_01');
  check('login email made from the name', anjali?.email === 'anjali.nair@psychologist.mentracare.in', anjali?.email);
  check('"Dr." dropped from login email', rahul?.email === 'rahul.menon@psychologist.mentracare.in', rahul?.email);
  check('accounts wait for a password', web.every((u) => u.needs_password && u.role === 'clinician'));
  check('title, photo and registration synced', anjali?.title === 'Counselling Psychologist' && anjali?.avatar_url === '/assets/psychologist_female.jpg' && anjali?.license_number === 'Kerala Health Authority Registered', JSON.stringify(anjali));
  d = await call(owner, 'GET', 'data');
  check('no duplicates on reload', d.users.filter((u) => u.from_website).length === 4);

  // Bookings
  let r = await book(booking());
  check('website booking accepted', r.ok === true, JSON.stringify(r));
  d = await call(owner, 'GET', 'data');
  const ravi = d.clients.find((c) => c.name === 'Ravi Kumar');
  check('client file created', Boolean(ravi) && ravi.source === 'website' && ravi.consent_status === 'pending');
  check('assigned to booked psychologist', ravi?.assigned_clinician_id === anjali.id);
  check('concerns and age from the booking form', ravi?.intake_concerns === 'Anxiety & stress, Overthinking' && ravi?.age_range === '25 to 34', `${ravi?.intake_concerns} / ${ravi?.age_range}`);
  const s1 = d.sessions.find((s) => s.client_id === ravi.id);
  check('session created with time and length', s1?.date === day(1) && s1?.start_time === '10:00' && s1?.end_time === '10:45' && s1?.booking_code === 'MNT-10001', JSON.stringify(s1));
  check('unverified without Razorpay secret', s1?.payment_verified === false);
  r = await book(booking());
  check('same booking sent twice is ignored', r.ok && r.duplicate === true && (await call(owner, 'GET', 'data')).sessions.length === 1);
  check('unknown psychologist rejected', !(await book(booking({ proId: 'psy_fake', ref: 'X1' }))).ok);
  check('incomplete booking rejected', !(await book(booking({ phone: '12', ref: 'X2' }))).ok);
  check('bad date rejected', !(await book(booking({ date: 'tomorrow', ref: 'X3' }))).ok);

  await call(owner, 'POST', `staff/${anjali.id}/password`, { password: 'Anjali1234' });
  const anjTok = (await call(null, 'POST', 'auth/login', { email: anjali.email, password: 'Anjali1234' })).token;
  const ad = await call(anjTok, 'GET', 'data');
  check('psychologist signs in and sees the client and session', ad.clients.length === 1 && ad.sessions.length === 1);
  const note = await call(anjTok, 'POST', 'notes', { client_id: ravi.id, appointment_id: s1.id, content: { assessment: 'First session report' } });
  check('report linked to the website session', note.note?.appointment_id === s1.id);
  await call(anjTok, 'POST', `notes/${note.note.id}/sign`, {});

  // Follow-up with another psychologist; phone typed differently.
  r = await book(booking({ proId: 'psy_clinical_01', date: day(8), time: '16:00', phone: '+91 98765 43210', email: '', ref: 'MNT-10002', concerns: ['depression'] }));
  d = await call(owner, 'GET', 'data');
  check('follow-up goes into the same file', d.clients.length === 1 && d.sessions.filter((s) => s.client_id === ravi.id).length === 2);
  check('file moves to the follow-up psychologist', d.clients[0].assigned_clinician_id === rahul.id);
  await call(owner, 'POST', `staff/${rahul.id}/password`, { password: 'Rahul12345' });
  const rahTok = (await call(null, 'POST', 'auth/login', { email: rahul.email, password: 'Rahul12345' })).token;
  const rd = await call(rahTok, 'GET', 'data');
  check('new psychologist sees the earlier report', rd.notes.some((n) => n.id === note.note.id));
  const s2 = rd.sessions.find((s) => s.booking_code === 'MNT-10002');
  const n2 = await call(rahTok, 'POST', 'notes', { client_id: ravi.id, appointment_id: s2.id, content: { assessment: 'Follow-up report' } });
  check('new psychologist adds the new report', n2.ok && n2.note.appointment_id === s2.id);
  const ad2 = await call(anjTok, 'GET', 'data');
  check('previous psychologist keeps her own report only', ad2.notes.some((n) => n.id === note.note.id) && !ad2.clients.length);

  // Child booking and Razorpay verification
  writeFileSync(configFile, originalConfig.replace("'razorpay_key_secret' => ''", "'razorpay_key_secret' => 'rzp_secret_test'"));
  const sig = createHmac('sha256', 'rzp_secret_test').update('order_1|pay_1').digest('hex');
  await book(booking({ name: 'Meera (child)', phone: '9988776655', email: 'parent@example.com', ref: 'MNT-10003', who: 'child', ageRange: 'Under 18', concerns: ['child'], razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: sig }));
  await book(booking({ name: 'Fake Person', phone: '9000000000', email: 'f@example.com', ref: 'MNT-10004', razorpay_order_id: 'order_2', razorpay_payment_id: 'pay_2', razorpay_signature: 'forged' }));
  d = await call(owner, 'GET', 'data');
  const meera = d.clients.find((c) => c.name === 'Meera (child)');
  check('child booking marked as minor with who-for note', meera?.is_minor === true && meera?.intake_concerns === 'For their child: Child & teen', meera?.intake_concerns);
  check('valid Razorpay signature marks payment verified', d.sessions.find((s) => s.booking_code === 'MNT-10003')?.payment_verified === true);
  check('forged signature stays unverified', d.sessions.find((s) => s.booking_code === 'MNT-10004')?.payment_verified === false);

  // Editing psychologists.js
  let js = readFileSync(psyFile, 'utf8');
  js = js.replace('name: "Anjali Nair, M.Sc.",', 'name: "Anjali Nair, M.Sc.",\n    email: "anjali@mentracare.in",');
  js = js.replace('window.MENTRA_PSYCHOLOGISTS = [', `window.MENTRA_PSYCHOLOGISTS = [
  { id: "psy_new_01", active: true, name: "Dr. Sana Thomas", title: "Clinical Psychologist", sessionMinutes: 50 },
  { id: "psy_hidden_01", active: false, name: "Hidden Person" },`);
  writeFileSync(psyFile, js);
  d = await call(owner, 'GET', 'data');
  check('email added on website becomes the login', d.users.find((u) => u.id === anjali.id)?.email === 'anjali@mentracare.in');
  check('newly added website psychologist gets an account', d.users.some((u) => u.name === 'Dr. Sana Thomas' && u.needs_password));
  check('inactive website psychologist is not added', !d.users.some((u) => u.name === 'Hidden Person'));
  check('session length taken from psychologists.js', (await book(booking({ proId: 'psy_new_01', durationMin: undefined, ref: 'MNT-10005', time: '11:00', phone: '9111111111', email: '' }))).ok
    && (await call(owner, 'GET', 'data')).sessions.find((s) => s.booking_code === 'MNT-10005')?.end_time === '11:50');
  await call(owner, 'POST', `staff/${rahul.id}/remove`, {});
  check('psychologist removed in MindLedger stays removed', !(await call(owner, 'GET', 'data')).users.some((u) => u.id === rahul.id));

  let last;
  for (let i = 0; i < 25; i++) last = await book(booking({ ref: `SPAM-${i}`, phone: `90000000${String(i).padStart(2, '0')}` }));
  check('booking endpoint is rate limited', last.status === 429, String(last.status));
} finally {
  writeFileSync(configFile, originalConfig);
}

const failed = results.filter((r) => r[0] === 'FAIL');
for (const r of results) console.log(r.filter(Boolean).join(' | '));
console.log(`\n${results.length - failed.length}/${results.length} website link checks passed`);
process.exit(failed.length ? 1 : 0);
