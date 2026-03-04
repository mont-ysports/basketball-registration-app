// src/scripts/makeAdmin.ts
// This is a utility script to promote a user to admin
// Run with: node -r esbuild-register src/scripts/makeAdmin.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config here
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function makeAdmin(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'admin'
    });
    console.log(`✅ User ${userId} is now an admin!`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Usage: Replace with your user ID
const USER_ID = 'YOUR_USER_ID_HERE';
makeAdmin(USER_ID);