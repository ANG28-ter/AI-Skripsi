import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Rocket,
  Sparkles,
  GraduationCap,
  BookOpen,
  Settings2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const modes = [
  { key: "prompt", label: "Gratis", icon: <Sparkles className="w-5 h-5" /> },
  { key: "quick", label: "Cepat", icon: <Rocket className="w-5 h-5" /> },
  {
    key: "dosen",
    label: "Tanya AI Dosen",
    icon: <GraduationCap className="w-5 h-5" />,
  },
];

export default function FloatingModeSwitcher({ mode, setMode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleModeSelect = (mKey) => {
    setMode(mKey);
    setOpen(false);

    if (mKey === "dosen") {
      // 🔹 Simpan preferensi mode
      localStorage.setItem("skripsi_mode", "dosen");
      // 🔹 Redirect ke halaman chat dosen
      navigate("/chat-dosen");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-neutral-900/80 border border-neutral-700 rounded-xl shadow-2xl p-3 space-y-2 backdrop-blur-lg"
          >
            {modes.map((m) => (
              <motion.button
                key={m.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleModeSelect(m.key)}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    mode === m.key
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
                      : "text-neutral-300 hover:bg-neutral-800"
                  }
                `}
              >
                {m.icon}
                <span>{m.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tombol utama */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        title="Pilih Mode"
        className="relative bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-white p-3 rounded-full shadow-xl transition-all duration-200"
      >
        {open ? <X className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
        {!open && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
        )}
      </motion.button>
    </div>
  );
}
