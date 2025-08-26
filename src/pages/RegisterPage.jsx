import React, { useState } from "react";
import { registerWithEmail } from "../services/auth";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErr("Password dan konfirmasi tidak cocok.");
      return;
    }

    try {
      await registerWithEmail(email, password);
      navigate("/skripsi");
    } catch (error) {
      console.error(error);
      setErr(error.message || "Gagal mendaftar");
    }
  };

  return (
    <div
  className="min-h-screen font-sans text-white relative overflow-hidden flex justify-center items-center p-8"
  style={{
    backgroundColor: "#0f1f28", // base color
  backgroundImage: 'url("/src/assets/circuit.svg")',
      backgroundRepeat: "repeat",
    backgroundSize: "cover",
  }}
>
        <div className="bg-white/5 border border-white/10 p-12 md:p-16 rounded-3xl backdrop-blur-md shadow-2xl max-w-xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-teal-300 mb-2">Buat Akun EduAI</h2>
          <p className="text-gray-400 text-sm">Daftar dan mulai petualangan akademikmu 🚀</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-8">
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

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full px-5 py-4 pr-12 rounded-xl bg-white/10 text-white placeholder-gray-400 outline-none border border-white/10 focus:ring-2 focus:ring-teal-500"
              />
              <div
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-4 flex items-center cursor-pointer text-gray-400 hover:text-white"
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Ulangi Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                className="w-full px-5 py-4 pr-12 rounded-xl bg-white/10 text-white placeholder-gray-400 outline-none border border-white/10 focus:ring-2 focus:ring-teal-500"
              />
              <div
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-4 flex items-center cursor-pointer text-gray-400 hover:text-white"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>
          </div>

          {/* Error */}
          {err && <p className="text-red-400 text-sm text-center">{err}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 text-black font-semibold py-4 rounded-xl shadow-md hover:brightness-110 transition"
          >
            Daftar Sekarang
          </button>
        </form>

        <div className="text-center text-sm text-gray-400">
          Sudah punya akun?{" "}
          <a href="/login" className="text-teal-400 hover:underline font-medium">
            Masuk di sini
          </a>
        </div>
      </div>
    </div>
  );
}