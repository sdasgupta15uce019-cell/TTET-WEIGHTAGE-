import { initializeApp } from "firebase/app";
import { getFirestore, terminate, clearIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Function to clear cache if needed (can be called from admin)
export const resetCache = async () => {
  await terminate(db);
  await clearIndexedDbPersistence(db);
  window.location.reload();
};

export const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
