import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAkdSbDiamWSQeZQU7g3RsoyZiqwN-74GA",
  authDomain: "identity-verification-sy-dd573.firebaseapp.com",
  databaseURL: "https://identity-verification-sy-dd573-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "identity-verification-sy-dd573",
  storageBucket: "identity-verification-sy-dd573.firebasestorage.app",
  messagingSenderId: "1008215164215",
  appId: "1:1008215164215:web:20ffadf8ac74c9869646b2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances to use across your app
export const db = getFirestore(app); // Changed to getFirestore
export const auth = getAuth(app);