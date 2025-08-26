// src/components/PromptBuilder.jsx
import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { jurusanOptions } from "/src/components/JurusanSelector";
import {
  Rocket,
  RotateCcw,
  LockKeyhole,
  Download,
  Loader2,
} from "lucide-react";

const DAILY_LIMIT = 10;

export default function PromptBuilder() {
  const [topik, setTopik] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [loading, setLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [bab1Gabungan, setBab1Gabungan] = useState("");

  useEffect(() => {
    const today = new Date().toDateString();
    const usage = JSON.parse(localStorage.getItem("promptDailyLimit")) || {};
    if (usage.date === today) {
      setDailyCount(usage.count || 0);
      if (usage.count >= DAILY_LIMIT) setLimitReached(true);
    }
  }, []);

  useEffect(() => {
    const savedTopik = localStorage.getItem("gratis_topik");
    const savedJurusan = localStorage.getItem("gratis_jurusan");
    const savedBAB = localStorage.getItem("gratis_hasil_bab1Gabungan");
    if (savedTopik) setTopik(savedTopik);
    if (savedJurusan) setJurusan(savedJurusan);
    if (savedBAB) setBab1Gabungan(savedBAB);
  }, []);

  useEffect(() => {
    localStorage.setItem("gratis_topik", topik);
    localStorage.setItem("gratis_jurusan", jurusan);
  }, [topik, jurusan]);

  const incrementUsage = () => {
    const today = new Date().toDateString();
    const usage = JSON.parse(localStorage.getItem("promptDailyLimit")) || { count: 0, date: today };
    const updated = usage.date === today ? { ...usage, count: usage.count + 1 } : { count: 1, date: today };
    localStorage.setItem("promptDailyLimit", JSON.stringify(updated));
    setDailyCount(updated.count);
    if (updated.count >= DAILY_LIMIT) setLimitReached(true);
  };

  const exportText = (text, label) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${label}.txt`);
  };

  const generateBab1 = async () => {
    if (!topik || !jurusan) return alert("Topik dan jurusan harus diisi.");
    setLoading(true);
    setBab1Gabungan("");

    try {
      const fetchPart = async (endpoint, label) => {
        const res = await fetch(`http://localhost:3001/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topik, jurusan }),
        });
        const data = await res.json();
        return data[label]?.replace(/[#*]+/g, "") || "";
      };

      const latar = await fetchPart("generate-latar-belakang", "latarBelakang");
      const rumusan = await fetchPart("generate-rumusan-masalah", "rumusanMasalah");
      const tujuan = await fetchPart("generate-tujuan-penelitian", "tujuanPenelitian");
      const manfaat = await fetchPart("generate-manfaat-penelitian", "manfaatPenelitian");
      const ruang = await fetchPart("generate-ruang-lingkup", "ruangLingkup");
      const sistematika = await fetchPart("generate-sistematika-penulisan", "sistematikaPenulisan");

      const gabungan = `BAB I\n\n1.1 Latar Belakang\n${latar}\n\n1.2 Rumusan Masalah\n${rumusan}\n\n1.3 Tujuan Penelitian\n${tujuan}\n\n1.4 Manfaat Penelitian\n${manfaat}\n\n1.5 Ruang Lingkup\n${ruang}\n\n1.6 Sistematika Penulisan\n${sistematika}`;

      setBab1Gabungan(gabungan);
      localStorage.setItem("gratis_hasil_bab1Gabungan", gabungan);
      incrementUsage();
    } catch (err) {
      console.error("Gagal generate BAB I:", err);
      alert("Terjadi kesalahan saat generate.");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("gratis_")) localStorage.removeItem(key);
    });
    location.reload();
  };

  return (
    <div className="bg-surfaceDark/60 backdrop-blur-xl p-6 rounded-2xl ring-1 ring-white/10 shadow-xl text-white space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-primary">Akses Gratis: BAB I</h3>
        <p className="text-sm text-slate-300">
          Anda telah menggunakan <strong>{dailyCount}</strong> dari {DAILY_LIMIT} kuota harian.
        </p>
        {limitReached && <p className="text-red-400 text-sm font-semibold mt-1">Batas harian tercapai.</p>}
      </div>

      <input
        type="text"
        value={topik}
        onChange={(e) => setTopik(e.target.value)}
        placeholder="Masukkan topik skripsi..."
        disabled={limitReached}
        className="w-full bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
      />

      <select
        value={jurusan}
        onChange={(e) => setJurusan(e.target.value)}
        disabled={limitReached}
        className="w-full bg-neutral-800 border border-neutral-600 rounded-lg p-3 text-sm text-white"
      >
        <option value="">Pilih Jurusan</option>
        {jurusanOptions.map((group, idx) => (
          <optgroup key={idx} label={group.label}>
            {group.options.map((opt, i) => (
              <option key={`${group.label}-${i}`} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={generateBab1}
          disabled={loading || limitReached}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-green-400 hover:brightness-110 text-black font-semibold text-sm transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {loading ? "Memproses..." : "Generate BAB I"}
        </button>

        <button
          onClick={clearAll}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm"
        >
          <RotateCcw className="w-4 h-4" /> Hapus Riwayat
        </button>
      </div>

      {bab1Gabungan && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 text-sm leading-relaxed">
          <h4 className="text-cyan-400 font-semibold mb-2">Hasil BAB</h4>
          <div className="prose prose-invert text-white text-sm max-w-none mb-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{bab1Gabungan}</ReactMarkdown>
          </div>
          <button
            onClick={() => exportText(bab1Gabungan, "BAB_I_Skripsi")}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded text-xs font-medium"
          >
            <Download className="w-4 h-4" /> Simpan BAB I
          </button>
        </div>
      )}

      <div className="bg-white/5 border border-primary text-yellow-100 rounded-xl p-4 mt-6">
        <div className="flex items-center gap-2 mb-2 font-semibold text-yellow-200">
          <LockKeyhole className="w-4 h-4" /> Fitur Premium
        </div>
        <ul className="text-sm list-disc list-inside space-y-1">
          <li>Akses semua BAB II–V</li>
          <li>Export ke DOCX, PDF, Template</li>
          <li>Parafrase dan koreksi otomatis</li>
          <li>Chat AI Dosen Pembimbing</li>
        </ul>
        <button className="mt-4 bg-primary text-black font-semibold px-4 py-2 rounded transition-all text-sm">
          Upgrade Sekarang
        </button>
      </div>
    </div>
  );
}
