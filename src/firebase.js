// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyAKkGFzT8rJBbPJA2rr_n8triN-SnK6xHQ",
  authDomain: "resquenet-cc2e3.firebaseapp.com",
  projectId: "resquenet-cc2e3",
  storageBucket: "resquenet-cc2e3.firebasestorage.app",
  messagingSenderId: "97365557217",
  appId: "1:97365557217:web:37f89bd5f2e0625cc89ca0",
  measurementId: "G-EMCLDP6T4H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
