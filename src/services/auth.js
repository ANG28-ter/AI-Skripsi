// src/services/auth.js
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

/**
 * Login dengan Google (popup)
 * Lebih praktis dibanding redirect karena tidak perlu reload halaman.
 */
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("✅ Login Google berhasil:", result.user);
    return result.user;
  } catch (error) {
    console.error("❌ Gagal login Google:", error);
    throw error;
  }
};

/**
 * Register user baru dengan email & password
 */
export const registerWithEmail = async (email, password) => {
  try {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log("✅ Registrasi berhasil:", userCred.user);
    return userCred.user;
  } catch (error) {
    console.error("❌ Gagal registrasi:", error);
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("✅ Berhasil logout");
  } catch (error) {
    console.error("❌ Gagal logout:", error);
  }
};

/**
 * Observe perubahan status login user
 * @param {function} callback - fungsi yang dipanggil setiap ada perubahan user
 */
export const observeAuth = (callback) => onAuthStateChanged(auth, callback);
