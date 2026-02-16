import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAuJwd1I0hNuRhsORwOKXc4QYTgmJ0qBHA",
  authDomain: "riverside-ranch.firebaseapp.com",
  projectId: "riverside-ranch",
  storageBucket: "riverside-ranch.firebasestorage.app",
  messagingSenderId: "823902144181",
  appId: "1:823902144181:web:65fb56bf3dc27cb0b720fc",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
