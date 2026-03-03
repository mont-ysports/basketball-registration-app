// src/lib/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Replace with YOUR Firebase config from Step 2.6
const firebaseConfig = {
  apiKey: "AIzaSyD-Q_ajEpKgOilJWWt2HC75qRC0AFYfVc4",
  authDomain: "basketball-registration-9a352.firebaseapp.com",
  projectId: "basketball-registration-9a352",
  storageBucket: "basketball-registration-9a352.firebasestorage.app",
  messagingSenderId: "182803490261",
  appId: "1:182803490261:web:002c0404c0138580ea895c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;