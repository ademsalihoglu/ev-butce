import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  initializeAuth,
  // @ts-ignore — the RN persistence helper ships with the SDK but is not part of the
  // public type surface on web; we guard the usage behind Platform.OS.
  getReactNativePersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

function getOrInitApp(): FirebaseApp {
  if (!firebaseConfigured) {
    throw new Error(
      'Firebase yapılandırması eksik. Lütfen .env dosyasına EXPO_PUBLIC_FIREBASE_* değerlerini ekleyin.'
    );
  }
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig as Required<typeof firebaseConfig>);
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  const app = getOrInitApp();
  if (Platform.OS === 'web') {
    try {
      _auth = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      });
    } catch {
      _auth = getAuth(app);
    }
  } else {
    try {
      _auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      _auth = getAuth(app);
    }
  }
  return _auth;
}
