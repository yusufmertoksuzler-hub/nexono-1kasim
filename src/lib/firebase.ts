import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyAhD0moZyU1RH59Z0JLrmFa8yk3dK3rFTc',
  authDomain: 'hisse-borsa.firebaseapp.com',
  projectId: 'hisse-borsa',
  storageBucket: 'hisse-borsa.firebasestorage.app',
  messagingSenderId: '1007646032594',
  appId: '1:1007646032594:web:2ff3ac04a835f4020f630b',
  measurementId: 'G-FYX0W04MX1'
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics optional
isSupported().then((ok) => {
  if (ok) {
    getAnalytics(app);
  }
});

export default app;


