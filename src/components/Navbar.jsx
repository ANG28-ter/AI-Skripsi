import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { observeAuth, logout } from "../services/auth";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = observeAuth((u) => setUser(u));
    return unsub;
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("❌ Gagal logout:", err);
    }
  };

  return (
    <nav className="max-w-4xl mx-auto rounded-3xl bg-black/20 text-white border-b border-gray-800 shadow-md py-4 my-4 backdrop-blur-md">
      <div className="mx-auto px-6 flex justify-between items-center rounded-2xl">
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight text-white hover:text-teal-400 transition"
        >
          EduAI<span className="text-teal-400">.</span>
        </Link>

        {!user ? (
          // Belum login → tombol login
          <Link
            to="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-semibold hover:brightness-110 transition shadow-lg"
          >
            <User size={18} />
          </Link>
        ) : (
          // Sudah login → nama + tombol logout
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {user.displayName || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500 text-white text-sm font-semibold hover:brightness-110 transition"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
