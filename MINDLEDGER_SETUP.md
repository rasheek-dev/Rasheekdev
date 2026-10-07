# MindLedger setup (Firebase + Hostinger, no PHP)

MindLedger is a set of plain files on Hostinger. Logins and data live in your own free Firebase project. Total time: about 15 minutes.

You need two files from this project:

- `mindledger-upload.zip`: the app (run `npm run package` to rebuild it)
- `firebase/firestore.rules`: the security rules

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> and sign in with a Google account.
2. Click **Create a project**, name it (e.g. `mentra-mindledger`), and finish. Google Analytics is not needed.

## 2. Turn on email/password login

1. In the left menu: **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Email/Password** → switch on the first toggle → **Save**.
3. **Settings** tab → **Authorized domains** → **Add domain** → `mentracare.in` (add `www.mentracare.in` too if you use it).

## 3. Create the database in India

1. **Build → Firestore Database → Create database**.
2. Location: **asia-south1 (Mumbai)**. This cannot be changed later.
3. Choose **production mode** and create.
4. Open the **Rules** tab, delete everything in it, paste the whole contents of `firebase/firestore.rules`, and click **Publish**.

The rules are what keep clinic data private. Skip this step and nobody can use the app; paste the wrong rules and data could be exposed.

## 4. Get your web app settings

1. Click the gear icon → **Project settings** → **General**.
2. Under **Your apps**, click the web icon `</>`, give it a nickname, and **Register app** (Firebase Hosting is not needed).
3. Keep the `firebaseConfig` values it shows: `apiKey`, `authDomain`, `projectId`, `appId`. These are not secret; the security rules protect the data.

## 5. Upload to Hostinger

1. hPanel → **File Manager** → open `public_html`.
2. If an old `mindledger` folder exists from earlier attempts, delete it.
3. Upload `mindledger-upload.zip` into `public_html`, right-click → **Extract**. You should now have `public_html/mindledger/index.html`.
4. Edit `public_html/mindledger/config.js` and paste your four values:

   ```js
   window.MINDLEDGER_CONFIG = {
     firebase: {
       apiKey: 'AIza...',
       authDomain: 'mentra-mindledger.firebaseapp.com',
       projectId: 'mentra-mindledger',
       appId: '1:1234567890:web:abc123',
     },
     allowSignup: true,
   };
   ```

5. Save. `.htaccess` is a hidden file; it is already in the folder (turn on "show hidden files" to see it).

## 6. Create your clinic

1. Open <https://mentracare.in/mindledger/signup> and register your clinic. You become the **Clinic Owner**.
2. Edit `config.js` again and change `allowSignup: true` to `allowSignup: false`, so nobody else can register.
3. In the app: **Clinic Settings → Add Staff Member** for each psychologist and front-desk coordinator. Give them their email and the initial password; they can change it with **Forgot password?** on the sign-in page.

## Everyday use

- **Clients**: owner or coordinator creates the client file and assigns a psychologist.
- **Session notes**: open a client → **Write Clinical Note** → Save Draft → **Sign & Lock**. Signed notes cannot be edited; add an addendum instead.
- **Assessments**: **Send Assessment** → pick client and PHQ-9 or GAD-7 → **Generate Link** → **Send on WhatsApp** (or copy/email). The client fills it in on their phone without logging in; the score appears in MindLedger right away. Links expire after 7 days and work once.
- **Reports**: **Clinical Reports** (owner) for clinic activity and CSV export; **Print Client Report** in a client file for a single client.

## Who sees what

| | Clinic Owner | Psychologist | Coordinator |
|---|---|---|---|
| Client contact details | All clients | Own caseload | All clients |
| Session notes & assessments | All | Own caseload | None |
| Reports, settings, staff | Yes | No | No |

These limits are enforced by the Firestore rules, not just hidden in the screens.

## Limits and costs

Firebase's free Spark plan allows 50,000 reads and 20,000 writes per day, far more than a small practice uses. Nothing is charged unless you upgrade the plan yourself.

## Troubleshooting

- **"MindLedger is not connected yet"**: `config.js` still has the `PASTE_...` placeholders.
- **"You do not have permission to do that"** on every action: the rules from step 3 were not published.
- **Blank page or 404 when refreshing**: `.htaccess` is missing from `public_html/mindledger/`, or the folder is not named `mindledger`. To use another folder name, rebuild with `VITE_BASE_PATH=/yourname/ npm run package` and change both `/mindledger/` paths in `.htaccess`.
- **Password reset email not arriving**: check spam. The sender is `noreply@<project>.firebaseapp.com`.

## For developers

- `npm run dev`: local development server
- `npm run lint`: type check
- `npm run package`: build and create `mindledger-upload.zip`
- `npm run test:rules`: run the 78 security-rule checks against the Firebase emulator (needs Java and `npx firebase-tools`)
