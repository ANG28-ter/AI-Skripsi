import React from "react";
import JurusanSelector from "./JurusanSelector";
import { Sparkles, GraduationCap } from "lucide-react";
import { saveField } from "../services/firestoreService"; // pastikan path benar

export default function InputCard({ topik, setTopik, jurusan, setJurusan }) {
  const handleTopikChange = async (e) => {
    const val = e.target.value;
    setTopik(val);
    try {
      await saveField("topik", val);
      console.log("✅ Topik berhasil disimpan ke Firestore");
    } catch (err) {
      console.error("❌ Gagal simpan topik:", err.message);
    }
  };

  const handleJurusanChange = async (e) => {
    const val = e.target.value;
    setJurusan(val);
    try {
      await saveField("jurusan", val);
      console.log("✅ Jurusan berhasil disimpan ke Firestore");
    } catch (err) {
      console.error("❌ Gagal simpan jurusan:", err.message);
    }
  };

  return (
    <div className="bg-surfaceDark/80 backdrop-blur-md p-8 md:p-10 rounded-2xl max-w-3xl mx-auto space-y-6 shadow-lg">
      <div>
        <label className="inline-flex items-center gap-2 text-slate-300 text-sm font-medium mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Topik
        </label>
        <input
          value={topik}
          onChange={handleTopikChange}
          placeholder="Masukkan topik skripsi"
          className="w-full px-6 py-3 rounded-xl bg-zinc-800/80 backdrop-blur text-white text-base placeholder:text-zinc-500 focus:outline-none focus:ring-2 ring-primary"
        />
      </div>

      <div>
        <label className="inline-flex items-center gap-2 text-slate-300 text-sm font-medium mb-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          Jurusan
        </label>
        <JurusanSelector
          value={jurusan}
          onChange={handleJurusanChange}
        />
      </div>
    </div>
  );
}
