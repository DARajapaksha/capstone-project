import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkdSbDiamWSQeZQU7g3RsoyZiqwN-74GA",
  authDomain: "identity-verification-sy-dd573.firebaseapp.com",
  projectId: "identity-verification-sy-dd573",
  storageBucket: "identity-verification-sy-dd573.firebasestorage.app",
  messagingSenderId: "1008215164215",
  appId: "1:1008215164215:web:20ffadf8ac74c9869646b2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);