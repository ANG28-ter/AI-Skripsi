import {
  doc,
  setDoc,
  getDoc,
  deleteField,
  collection,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const COLLECTION = "skripsiData";
const SUBCOLLECTION = "fields";
const SIZE_LIMIT = 900 * 1024; // ~900KB, biar aman sebelum limit 1MB

// ==========================
// LocalStorage Helpers
// ==========================
function saveLocal(key, value) {
  try {
    localStorage.setItem(`skripsi_${key}`, JSON.stringify(value ?? ""));
  } catch (err) {
    console.warn(`⚠️ Gagal simpan localStorage: ${key}`, err);
  }
}

function loadLocal(key) {
  try {
    const val = localStorage.getItem(`skripsi_${key}`);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.warn(`⚠️ Gagal load localStorage: ${key}`, err);
    return null;
  }
}

function deleteLocal(key) {
  try {
    localStorage.removeItem(`skripsi_${key}`);
  } catch (err) {
    console.warn(`⚠️ Gagal hapus localStorage: ${key}`, err);
  }
}

// ==========================
// User State Management
// ==========================
let currentUser = null;
let userReadyPromiseResolve;
const userReadyPromise = new Promise((resolve) => {
  userReadyPromiseResolve = resolve;
});

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  userReadyPromiseResolve(user); // ✅ tandai user siap
});

export function getCurrentUser() {
  return currentUser;
}

export async function waitForUser() {
  if (currentUser !== null) return currentUser;
  return userReadyPromise;
}

// ==========================
// Firestore + LocalStorage API
// ==========================

function estimateSize(value) {
  try {
    return new Blob([JSON.stringify(value)]).size;
  } catch {
    return 0;
  }
}

/**
 * Saves a single field to Firestore + localStorage.
 * Auto: jika value > 900KB → simpan ke subkoleksi.
 */
export async function saveField(fieldKey, value) {
  saveLocal(fieldKey, value); // Always save local

  const user = await waitForUser();
  if (!user) return; // Belum login

  const size = estimateSize(value);

  if (size > SIZE_LIMIT) {
    // 🔹 Simpan di subkoleksi
    const ref = doc(
      collection(db, COLLECTION, user.uid, SUBCOLLECTION),
      fieldKey
    );
    await setDoc(ref, { value });
  } else {
    // 🔹 Simpan di dokumen utama
    const ref = doc(db, COLLECTION, user.uid);
    await setDoc(ref, { [fieldKey]: value }, { merge: true });
  }
}

/**
 * Loads a field with Firestore → localStorage fallback.
 */
export async function loadField(fieldKey) {
  const user = await waitForUser();
  if (user) {
    try {
      // 🔹 Coba cek di dokumen utama
      const ref = doc(db, COLLECTION, user.uid);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data()[fieldKey] !== undefined) {
        const val = snap.data()[fieldKey];
        saveLocal(fieldKey, val);
        return val;
      }

      // 🔹 Kalau tidak ada → cek di subkoleksi
      const subRef = doc(db, COLLECTION, user.uid, SUBCOLLECTION, fieldKey);
      const subSnap = await getDoc(subRef);
      if (subSnap.exists()) {
        const val = subSnap.data().value;
        saveLocal(fieldKey, val);
        return val;
      }
    } catch (err) {
      console.warn(`⚠️ Firestore error load ${fieldKey}:`, err);
    }
  }
  return loadLocal(fieldKey);
}

/**
 * Deletes a field from Firestore + localStorage.
 */
export async function deleteFieldData(fieldKey) {
  deleteLocal(fieldKey);

  const user = await waitForUser();
  if (!user) return;

  try {
    const ref = doc(db, COLLECTION, user.uid);
    await setDoc(ref, { [fieldKey]: deleteField() }, { merge: true });

    const subRef = doc(db, COLLECTION, user.uid, SUBCOLLECTION, fieldKey);
    await setDoc(subRef, {}, { merge: false }); // kosongkan subdoc
  } catch (err) {
    console.warn(`⚠️ Firestore error delete ${fieldKey}:`, err);
  }
}

/**
 * Bulk clear multiple fields from Firestore + localStorage.
 */
export async function clearFields(keys = []) {
  keys.forEach((key) => deleteLocal(key));

  const user = await waitForUser();
  if (!user) return;

  try {
    const ref = doc(db, COLLECTION, user.uid);
    const payload = keys.reduce((acc, key) => {
      acc[key] = deleteField();
      return acc;
    }, {});
    await setDoc(ref, payload, { merge: true });

    for (const key of keys) {
      const subRef = doc(db, COLLECTION, user.uid, SUBCOLLECTION, key);
      await setDoc(subRef, {}, { merge: false });
    }
  } catch (err) {
    console.warn("⚠️ Firestore error clearFields:", err);
  }
}
