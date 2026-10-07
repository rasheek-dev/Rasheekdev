// MindLedger settings. Edit this file on your server; no rebuild is needed.
// Paste the values from Firebase console > Project settings > Your apps > Web app (SDK setup and configuration).
window.MINDLEDGER_CONFIG = {
  firebase: {
    apiKey: 'PASTE_API_KEY_HERE',
    authDomain: 'PASTE_PROJECT_ID.firebaseapp.com',
    projectId: 'PASTE_PROJECT_ID',
    appId: 'PASTE_APP_ID',
  },
  // After you have registered your clinic, set this to false so nobody else can create a clinic.
  allowSignup: true,
};
