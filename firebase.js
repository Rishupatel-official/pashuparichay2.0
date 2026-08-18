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

    apiKey:
        "AIzaSyBBG6j2eXe2xocg7aV6Mp8VSEYIcxOT0bE",

    authDomain:
        "pashu-parichay-39f06.firebaseapp.com",

    projectId:
        "pashu-parichay-39f06",

    storageBucket:
        "pashu-parichay-39f06.firebasestorage.app",

    messagingSenderId:
        "593627877503",

    appId:
        "1:593627877503:web:afb0c734f9bb20df776f4a",

    measurementId:
        "G-M8L1T40F2F"
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