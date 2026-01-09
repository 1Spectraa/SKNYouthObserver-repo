// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";


const firebaseConfig = {
    apiKey: "AIzaSyBzTo4zCT01F3m2uwtzQM0PQ4aesmYjs1I",
    authDomain: "skn-youth-observer.firebaseapp.com",
    projectId: "skn-youth-observer",
    storageBucket: "skn-youth-observer.firebasestorage.app",
    messagingSenderId: "845540407146",
    appId: "1:845540407146:web:93fe1a24137cc5080ad713",
    measurementId: "G-VND64WKFVK"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ THESE MUST BE EXPORTED
export const auth = getAuth(app);
export const db = getFirestore(app);
