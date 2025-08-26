// src/lib/storage.js
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const USE_FIRESTORE = false; // Ganti ke true kalau mau pakai Firestore

// ========== LOCAL STORAGE ==========
const local = {
  save: async (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  },
  load: async (key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
};

// ========== FIRESTORE ==========
const firestore = {
  save: async (key, data, userId) => {
    if (!userId) throw new Error("userId diperlukan untuk Firestore");
    const ref = doc(db, "skripsiData", `${userId}_${key}`);
    await setDoc(ref, { data });
  },
  load: async (key, userId) => {
    if (!userId) throw new Error("userId diperlukan untuk Firestore");
    const ref = doc(db, "skripsiData", `${userId}_${key}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().data : null;
  },
};

// ========== INTERFACE ==========
export const storage = {
  save: async (key, data, userId = null) => {
    return USE_FIRESTORE
      ? firestore.save(key, data, userId)
      : local.save(key, data);
  },

  load: async (key, userId = null) => {
    return USE_FIRESTORE
      ? firestore.load(key, userId)
      : local.load(key);
  },
};

// simpan data = await storage.save("bab1", data, user?.uid);
//ambil data = const bab1Data = await storage.load("bab1", user?.uid);
