// ======================================================
// PASHU PARICHAY - FIREBASE CONFIGURATION
// ======================================================

// Firebase App
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

// Firebase Authentication
import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

// Cloud Firestore
import { getFirestore } from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// Firebase Storage
import { getStorage } from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";


// ======================================================
// FIREBASE CONFIGURATION
// ======================================================

const firebaseConfig = {
  apiKey: "AIzaSyDTqrFtIRMqQcbrq5dwbtlHxaHrr5_NObw",
  authDomain: "pashu-parichay-22c48.firebaseapp.com",
  projectId: "pashu-parichay-22c48",
  storageBucket: "pashu-parichay-22c48.firebasestorage.app",
  messagingSenderId: "771547978662",
  appId: "1:771547978662:web:98dac0983e2e3174d8cd67",
  measurementId: "G-3B8W5QJ07L"
};


// ======================================================
// INITIALIZE FIREBASE
// ======================================================

const app = initializeApp(firebaseConfig);


// ======================================================
// FIREBASE SERVICES
// ======================================================

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);


// ======================================================
// EXPORT APP
// ======================================================

export { app };
