// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDKlXwqNtyR94Ra7MNEoyXiwGXyBQgIN9s",
  authDomain: "handstats-ac5fa.firebaseapp.com",
  projectId: "handstats-ac5fa",
  storageBucket: "handstats-ac5fa.firebasestorage.app",
  messagingSenderId: "882136413319",
  appId: "1:882136413319:web:fe5977e49824fe88b6b422",
  measurementId: "G-ND4ZTY5DGR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export default app; 