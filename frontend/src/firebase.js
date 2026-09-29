import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyMockKeyForDev_ChangeInEnv",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "deadeye-cyclone.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "deadeye-cyclone",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "deadeye-cyclone.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

let app = null;
let auth = null;
let isRealFirebase = false;

try {
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'your_client_api_key') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    isRealFirebase = true;
  }
} catch (error) {
  console.warn('[Firebase] Fallback mock auth active:', error.message);
}

export { app, auth, isRealFirebase, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged };