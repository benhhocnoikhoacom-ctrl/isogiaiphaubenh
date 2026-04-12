import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;

let adminApp: App;

if (!getApps().length) {
  if (serviceAccountBase64) {
    const serviceAccountBuffer = Buffer.from(serviceAccountBase64, 'base64');
    const serviceAccountJson = JSON.parse(serviceAccountBuffer.toString('utf-8'));

    adminApp = initializeApp({
      credential: cert(serviceAccountJson),
    });
  } else {
    throw new Error('GOOGLE_CREDENTIALS_BASE64 is not set. Firebase Admin cannot be initialized.');
  }
} else {
  adminApp = getApps()[0];
}

export const adminDb = getFirestore(adminApp);
