import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase"; // pastikan path sudah sesuai

const COLLECTION = "paraphrases";

/**
 * Simpan hasil parafrase untuk paragraf tertentu.
 * @param {string} babId - ID bab, contoh: 'bab1_rumusan_masalah'
 * @param {number} index - Index paragraf
 * @param {string} newText - Hasil parafrase
 */
export const saveParaphrase = async (babId, index, newText) => {
  const user = auth.currentUser;
  if (!user) return;

  const key = `paragraf_${babId}_${index}`;
  const ref = doc(db, COLLECTION, user.uid);

  try {
    const snap = await getDoc(ref);
    const existingData = snap.exists() ? snap.data() : {};

    await setDoc(ref, {
      ...existingData,
      [key]: newText,
    }, { merge: true });

  } catch (err) {
    console.error("❌ Gagal menyimpan parafrase:", err);
  }
};

/**
 * Ambil hasil parafrase untuk satu paragraf.
 * @param {string} babId
 * @param {number} index
 * @returns {Promise<string|null>}
 */
export const getParaphrase = async (babId, index) => {
  const user = auth.currentUser;
  if (!user) return null;

  const key = `paragraf_${babId}_${index}`;
  const ref = doc(db, COLLECTION, user.uid);

  try {
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data()[key] ?? null : null;
  } catch (err) {
    console.error("❌ Gagal mengambil parafrase:", err);
    return null;
  }
};

/**
 * Ambil semua parafrase milik user
 * @returns {Promise<Object>}
 */
export const getAllParaphrases = async () => {
  const user = auth.currentUser;
  if (!user) return {};

  const ref = doc(db, COLLECTION, user.uid);

  try {
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : {};
  } catch (err) {
    console.error("❌ Gagal mengambil semua parafrase:", err);
    return {};
  }
};

/**
 * Hapus semua data parafrase milik user
 */
export const clearAllParaphrases = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, COLLECTION, user.uid);

  try {
    await deleteDoc(ref);
    console.log("🗑️ Semua parafrase berhasil dihapus dari Firestore.");
    // Opsional: untuk trigger UI
    window.dispatchEvent(new Event("paraphrase_updated"));
  } catch (err) {
    console.error("❌ Gagal menghapus semua parafrase:", err);
  }
};
