import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setStatus("");
    setErr("");
    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("Link reset berhasil dikirim ke email.");
    } catch (error) {
      setErr(error.message || "Gagal mengirim email reset.");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#0f1f28] text-white font-sans px-4">
      <div className="bg-white/5 border border-white/10 p-12 md:p-16 rounded-3xl backdrop-blur-md shadow-2xl max-w-xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-teal-300 mb-2">Lupa Kata Sandi?</h2>
          <p className="text-gray-400 text-sm">
            Masukkan email akun kamu dan kami akan kirim link untuk reset password.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-5 py-4 rounded-xl bg-white/10 text-white placeholder-gray-400 outline-none border border-white/10 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Feedback */}
          {status && <p className="text-green-400 text-sm text-center">{status}</p>}
          {err && <p className="text-red-400 text-sm text-center">{err}</p>}

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 text-black font-semibold py-4 rounded-xl shadow-md hover:brightness-110 transition"
          >
            Kirim Link Reset
          </button>
        </form>

        <div className="text-center text-sm text-gray-400">
          <a href="/login" className="text-teal-400 hover:underline font-medium">
            Kembali ke Login
          </a>
        </div>
      </div>
    </div>
  );
}
