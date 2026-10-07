import { initializeApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

export interface MindLedgerConfig {
  firebase: FirebaseOptions;
  allowSignup?: boolean;
  emulatorHost?: string;
}

declare global {
  interface Window {
    MINDLEDGER_CONFIG?: MindLedgerConfig;
  }
}

export const config: MindLedgerConfig | undefined = window.MINDLEDGER_CONFIG;

export const isConfigured = Boolean(
  config?.firebase?.apiKey && config.firebase.projectId && !config.firebase.apiKey.startsWith('PASTE')
);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

function connectEmulators(a: Auth, d: Firestore) {
  const host = config?.emulatorHost;
  if (!host) return;
  connectAuthEmulator(a, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(d, host, 8080);
}

if (isConfigured) {
  app = initializeApp(config!.firebase);
  auth = getAuth(app);
  db = getFirestore(app);
  connectEmulators(auth, db);
}

export { app, auth, db };

// Creating a staff login with the main Auth instance would sign the owner out,
// so staff accounts are created through a separate, throwaway app instance.
export function createSecondaryAuth(): { auth: Auth; dispose: () => Promise<void> } {
  const secondary = initializeApp(config!.firebase, `staff-${Date.now()}`);
  const secondaryAuth = getAuth(secondary);
  const host = config?.emulatorHost;
  if (host) connectAuthEmulator(secondaryAuth, `http://${host}:9099`, { disableWarnings: true });
  return {
    auth: secondaryAuth,
    dispose: async () => {
      const { deleteApp } = await import('firebase/app');
      await deleteApp(secondary);
    },
  };
}
