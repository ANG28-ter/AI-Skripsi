import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, LogOut, Menu, X } from "lucide-react";
import { observeAuth, logout } from "../services/auth";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = observeAuth((u) => setUser(u));
    return unsub;
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
    } catch (err) {
      console.error("❌ Gagal logout:", err);
    }
  };

  return (
    <nav className="max-w-4xl mx-auto rounded-3xl bg-black/20 text-white border-b border-gray-800 shadow-md py-4 my-4 backdrop-blur-md relative">
      <div className="mx-auto px-6 flex justify-between items-center rounded-2xl">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight text-white hover:text-teal-400 transition"
        >
          EduAI<span className="text-teal-400">.</span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-3">
          {!user ? (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-semibold hover:brightness-110 transition shadow-lg"
            >
              <User size={18} />
              Login
            </Link>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Burger button (mobile only) */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-white/10 transition"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-black/90 rounded-b-3xl shadow-lg p-6 flex flex-col gap-4">
          {!user ? (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-semibold hover:brightness-110 transition shadow-lg"
            >
              <User size={18} />
              Login
            </Link>
          ) : (
            <>
              <span className="text-sm font-medium text-white">
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:brightness-110 transition shadow-lg"
              >
                <LogOut size={18} />
                Keluar
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
