import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let firebaseApp = null;
let isInitialized = false;

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    isInitialized = true;
    console.log('[FirebaseAdmin] Initialized via serviceAccountKey.json');
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });
    isInitialized = true;
    console.log('[FirebaseAdmin] Initialized via environment variables');
  } else {
    console.warn('[FirebaseAdmin] Operating in Development / Demo Auth Mode.');
  }
} catch (error) {
  console.warn('[FirebaseAdmin] Warning initializing Firebase Admin:', error.message);
}

export { admin, isInitialized };
export default admin;