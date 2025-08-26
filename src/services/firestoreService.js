import { doc, setDoc, getDoc, deleteField } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const COLLECTION = "skripsiData";

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

/**
 * Saves a single field to Firestore + localStorage.
 * If user not logged in, only saves to localStorage.
 */
export async function saveField(fieldKey, value) {
  saveLocal(fieldKey, value); // Always save local
  const user = await waitForUser();
  if (!user) return; // Belum login → stop di sini
  const ref = doc(db, COLLECTION, user.uid);
  await setDoc(ref, { [fieldKey]: value }, { merge: true });
}

/**
 * Loads a field with Firestore → localStorage fallback.
 */
export async function loadField(fieldKey) {
  const user = await waitForUser();
  if (user) {
    try {
      const ref = doc(db, COLLECTION, user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const val = snap.data()[fieldKey];
        if (val !== undefined) {
          saveLocal(fieldKey, val); // sync ke local
          return val;
        }
      }
    } catch (err) {
      console.warn(`⚠️ Firestore error load ${fieldKey}:`, err);
    }
  }
  // Firestore kosong / error → load dari local
  return loadLocal(fieldKey);
}

/**
 * Deletes a field from Firestore + localStorage.
 */
export async function deleteFieldData(fieldKey) {
  deleteLocal(fieldKey);
  const user = await waitForUser();
  if (!user) return;
  const ref = doc(db, COLLECTION, user.uid);
  await setDoc(ref, { [fieldKey]: deleteField() }, { merge: true });
}

/**
 * Bulk clear multiple fields from Firestore + localStorage.
 */
export async function clearFields(keys = []) {
  keys.forEach((key) => deleteLocal(key));
  const user = await waitForUser();
  if (!user) return;
  const ref = doc(db, COLLECTION, user.uid);
  const payload = keys.reduce((acc, key) => {
    acc[key] = deleteField();
    return acc;
  }, {});
  await setDoc(ref, payload, { merge: true });
}
