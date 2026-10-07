# MindLedger setup (Hostinger, PHP + MySQL)

MindLedger runs in `public_html/mindledger/` on your Hostinger hosting and keeps its data in your Hostinger MySQL database. No other service is needed.

## 1. Database

MindLedger uses an existing MySQL database. It creates its own tables, all named `ml_...`, and does not touch any other tables, so it can share the Mentra database.

`mindledger/api/config.php` is pre-filled with the Mentra database details:

```php
'db_host' => 'localhost',
'db_name' => 'u180950667_mentra',
'db_user' => 'u180950667_mentra',
'db_pass' => '(your database password)',
```

If your database in **hPanel → Databases → Management** has a different name, user or password, change these four lines after uploading (step 2). If you have no database yet, create one there first.

## 2. Upload

1. hPanel → **File Manager** → open `public_html`.
2. Delete any old `mindledger` folder from earlier attempts.
3. Upload `mindledger-upload.zip` into `public_html`, right-click → **Extract**.
4. Check that you now have `public_html/mindledger/index.html` and `public_html/mindledger/api/index.php`. The two `.htaccess` files are hidden; turn on "show hidden files" to see them.

PHP 8.0 or newer is required (hPanel → **Advanced → PHP Configuration**). Hostinger's default is fine.

## 3. Create your clinic

1. Open <https://mentracare.in/mindledger/>.
2. The first visit shows **Set Up Your Clinic**. Enter the clinic name, your name, email and a password. You become the **Clinic Owner**.

   This page appears only once. After that, everyone sees the sign-in page.

   If you see **Database not connected** instead, the message shows the exact problem. Fix the details in `mindledger/api/config.php` (step 1) and click **Try again**.
3. **Clinic Settings → Add Staff Member** for each psychologist and front-desk coordinator. Give each person their email and initial password.

## Psychologists from the website

MindLedger reads `public_html/psychologists.js`, the file you already edit to list psychologists on the website. Every active psychologist there gets a MindLedger psychologist account, marked **From website** in Clinic Settings, with **Login not set up** until you click **Set Password**.

- The login email is built from the name, e.g. `anjali.nair@psychologist.mentracare.in`. To use a real address, add a line such as `email: "anjali@mentracare.in",` to that psychologist in `psychologists.js`.
- Name, title, photo and registration follow the file. `active: false` stops new accounts but does not delete existing ones; remove someone in Clinic Settings.

## Booking sessions

The front desk (or owner) books every visit inside MindLedger, so the psychologist sees the client at that date and time.

- **New client**: **New Client** (or **Book Session** on the dashboard) → fill in the client's details → in **First session** choose the psychologist, date, start time, length and mode → **Create Client & Book Session**.
- **Returning client**: type their phone number in **Returning client? Search by phone number** (4 digits are enough) and pick them. **Follow-up session** is right at the top: choose psychologist, date and time → **Book Session & Open File**. If it's a different psychologist, the whole file, including all earlier reports, moves to them.
- Below the time you see what that psychologist already has booked that day. A time that overlaps another booking is refused, so nobody is double-booked.
- Untick **Book now** to only create the file or only change the psychologist, without a session.
- Inside a client file, **Book Session** adds another visit. The **Sessions** list shows every booking with **Done**, **No-show** and **Cancel** buttons. A cancelled time can be booked again.
- The psychologist sees **Upcoming Sessions** on their dashboard and clicks **Write Report** to write the report for that session. The client's earlier reports and assessment scores are in the client file.
- The front desk sees how many reports a client has, not what they say.
- Typing an existing number into the new-client form warns you, so the same person doesn't get two files.

## Everyday use

- **Clients**: the owner or a coordinator creates the client file, assigns a psychologist and books the session.
- **Session notes**: open a client → **Write Clinical Note** → **Save Draft** → **Sign & Lock**. Signed notes cannot be changed; use **Add Addendum**.
- **Assessments**: **Send Assessment** → choose client and PHQ-9 or GAD-7 → **Generate Link** → **Send on WhatsApp** (or copy/email). The client answers on their phone without logging in, and the score appears straight away. Each link works once and expires after 7 days. A PHQ-9 with item 9 (thoughts of self-harm) above zero is flagged in red.
- **Reports**: **Clinical Reports** (owner) shows clinic activity with CSV export. **Print Client Report** in a client's file prints one client.
- **Passwords**: everyone can change their own via their name (top right) → **Change Password**. The owner can set a new password for any staff member in **Clinic Settings → Reset Password**.

## Who sees what

| | Clinic Owner | Psychologist | Coordinator |
|---|---|---|---|
| Client contact details | All clients | Own caseload | All clients |
| Session notes & assessments | All | Own caseload | None |
| Reports, settings, staff | Yes | No | No |

The server enforces these limits, not just the screens.

## Forgotten owner password

1. Open `https://mentracare.in/hash.php` (Mentra's password tool), type a new password and copy the hash it shows.
2. hPanel → **Databases → phpMyAdmin** → your database → **SQL** tab, and run:

   ```sql
   UPDATE ml_users SET password_hash = 'PASTE_HASH_HERE' WHERE role = 'owner';
   ```
3. Sign in with the new password. Delete `hash.php` afterwards.

## Troubleshooting

- **Database not connected**: wrong details in `mindledger/api/config.php`. The message shows MySQL's exact error.
- **"The MindLedger API was not found"**: the `api` folder is missing from `public_html/mindledger/`.
- **Blank page, or 404 when refreshing a page**: `.htaccess` is missing from `public_html/mindledger/`, or the folder isn't named `mindledger`. To use a different folder name, rebuild with `VITE_BASE_PATH=/yourname/ npm run package` and change both `/mindledger/` paths in `.htaccess`.
- **Too many sign-in attempts**: after 10 wrong passwords, that connection must wait 15 minutes.

## For developers

- `npm run dev`: frontend dev server (needs the PHP API running at `/mindledger/api/index.php`)
- `npm run lint`: type check
- `npm run package`: build and create `mindledger-upload.zip`
- `node scripts/api-security-test.mjs <api url>`: 65 permission checks against a fresh database
- `node scripts/website-sync-test.mjs <api url> <web root>`: psychologists.js accounts, returning clients and session booking (37 checks)
