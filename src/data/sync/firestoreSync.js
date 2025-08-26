// src/data/sync/firestoreSync.js
import { loadField, saveField } from "../../services/firestoreService";

export const sync = {
  async pull(path, fallback = null) {
    try {
      const data = await loadField(path);
      return data ?? fallback;
    } catch (e) {
      console.error("Firestore pull error:", e);
      return fallback;
    }
  },
  async push(path, data) {
    try {
      await saveField(path, data);
      return true;
    } catch (e) {
      console.error("Firestore push error:", e);
      return false;
    }
  },
};
