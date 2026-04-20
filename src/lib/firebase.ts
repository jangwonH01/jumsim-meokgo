import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Reuse the daligo-e4dd3 Firebase project. Register a new Web app under
// the same project and paste the config here (Firebase console → Project
// settings → Your apps → Web app).
//
// Until the real config is filled in, Firestore calls will throw and the
// team-vote screen shows a config-missing banner.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'daligo-e4dd3',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) && Boolean(firebaseConfig.appId);

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const db = getFirestore(app);
