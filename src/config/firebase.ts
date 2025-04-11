import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase config
const firebaseConfig = {

  apiKey: "AIzaSyDBdGxcpZyyvDQdk-GkC_3Kkp-TlaG8Mhk",

  authDomain: "fookiki-d89b5.firebaseapp.com",

  databaseURL: "https://fookiki-d89b5-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId: "fookiki-d89b5",

  storageBucket: "fookiki-d89b5.firebasestorage.app",

  messagingSenderId: "1079708248811",

  appId: "1:1079708248811:web:74d2e02582b1ea3f41ecae",

  measurementId: "G-3C6M7QDSDP"

};


// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const firestore = getFirestore(app);
