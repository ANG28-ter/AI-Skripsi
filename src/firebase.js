import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Ganti ini dengan real credentials dari Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBm2yTT4M2gTyYBqmbh-MGNPJYvwO3H_TA",
  authDomain: "ai-project-f3855.firebaseapp.com",
  projectId: "ai-project-f3855",
  storageBucket: "ai-project-f3855.firebasestorage.app",
  messagingSenderId: "350514165731",
  appId: "1:350514165731:web:bfcabbb9a36b012286d2d6",
  measurementId: "G-JRWL3XTXVJ"
};

// Init app once
const app = initializeApp(firebaseConfig);

// Export configured services
export const db = getFirestore(app); // Firestore DB
export const auth = getAuth(app); // Firebase Auth
export const googleProvider = new GoogleAuthProvider(); // Google OAuth

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ Login persistence diset ke Local");
  })
  .catch((error) => {
    console.error("❌ Gagal set persistence:", error);
  });


export const COLLECTION = "skripsi_data";