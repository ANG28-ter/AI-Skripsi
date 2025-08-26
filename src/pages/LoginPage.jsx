import React, { useEffect, useState } from "react";
import { Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

import { loginWithGoogle, observeAuth, logout } from "../services/auth";
import { saveField } from "../services/firestoreService"; // ✅ tambahkan ini

export default function LoginPage() {
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();

  // 🔒 Cek login status realtime + Auto-sync data offline
  useEffect(() => {
    const unsubscribe = observeAuth(async (u) => {
      setUser(u);
      if (u) {
        console.log("✅ User login terdeteksi:", u.email);

        // Auto-sync localStorage ke Firestore
        const keys = Object.keys(localStorage).filter((k) =>
          k.startsWith("hasil_")
        );
        for (const key of keys) {
          try {
            const val = JSON.parse(localStorage.getItem(key));
            const fieldKey = key.replace(/^hasil_/, "");
            await saveField(fieldKey, val);
            console.log(`☁️ Synced ${fieldKey} → Firestore`);
          } catch (err) {
            console.warn(`⚠️ Gagal sync ${key}:`, err);
          }
        }

        // Setelah sync, redirect ke /skripsi
        navigate("/skripsi");
      }
    });
    return unsubscribe;
  }, [navigate]);

  // 🔐 Google Sign-in
  const handleGoogleLogin = async () => {
    setLoginError("");
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("❌ Gagal login:", error);
      setLoginError(error.message || "Gagal login Google");
    }
  };

  // 🔓 Logout
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error("❌ Gagal logout:", error);
    }
  };

  return (
    <div
      className="min-h-screen font-sans text-white relative overflow-hidden flex justify-center items-center p-8"
      style={{
        backgroundColor: "#0f1f28",
        backgroundImage: 'url("/src/assets/circuit.svg")',
        backgroundRepeat: "repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="w-full max-w-md bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Masuk ke EduAI
        </h2>

        {/* Debug user info */}
        {user && (
          <div className="mb-4 p-3 bg-green-800/20 text-green-300 text-sm rounded">
            <p>✅ Login sebagai: {user.displayName || user.email}</p>
            <p className="text-xs">UID: {user.uid}</p>
          </div>
        )}

        {/* Error message */}
        {loginError && (
          <div className="mb-4 p-3 bg-red-800/20 text-red-300 text-sm rounded">
            {loginError}
          </div>
        )}

        {!user ? (
          <>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              {/* Email */}
              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  Email
                </label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-cyan-500">
                  <Mail size={18} className="text-cyan-400 mr-3" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-transparent outline-none text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block mb-1 text-sm text-gray-300">
                  Password
                </label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-cyan-500">
                  <Lock size={18} className="text-cyan-400 mr-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-transparent outline-none text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="text-right text-sm">
                <a
                  href="/reset-password"
                  className="text-teal-400 hover:underline font-medium"
                >
                  Lupa kata sandi?
                </a>
              </div>

              {/* Manual login nonaktif */}
              <button
                type="submit"
                onClick={() =>
                  alert("Login manual belum aktif. Gunakan Google.")
                }
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-black font-semibold shadow-md hover:brightness-110 transition"
              >
                Masuk
              </button>
            </form>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 mt-3 rounded-xl bg-white text-black hover:brightness-105 transition font-medium shadow"
            >
              <FcGoogle size={24} />
              Masuk dengan Google
            </button>

            <p className="text-sm text-gray-400 text-center mt-2">
              Belum punya akun?{" "}
              <Link to="/register" className="text-teal-400 hover:underline">
                Daftar di sini
              </Link>
            </p>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full py-3 mt-4 rounded-xl bg-red-500 text-white font-semibold shadow-md hover:brightness-110 transition"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
