import { saveAs } from "file-saver";
import React, { useState, useEffect } from "react";
import {
  BookOpenCheck,
  Download,
  FileText,
  Loader2,
  SearchCheck,
  Trash2,
} from "lucide-react";
import { saveField, loadField } from "../services/firestoreService"; // 🔹 Firestore

export default function DaftarPustakaGenerator() {
  const [daftarPustaka, setDaftarPustaka] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Load hasil daftar pustaka saat awal
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadField("skripsi_daftarPustaka");
        if (saved) {
          setDaftarPustaka(saved);
        } else {
          const local = localStorage.getItem("skripsi_daftarPustaka");
          if (local) setDaftarPustaka(JSON.parse(local));
        }
      } catch (err) {
        console.error("❌ Gagal load daftar pustaka:", err);
      }
    })();
  }, []);

  // 🔹 Ambil BAB dari Firestore dulu, kalau kosong fallback localStorage
  const getBabData = async (keys) => {
    const values = [];
    for (const key of keys) {
      let val = await loadField(key);
      if (!val) val = localStorage.getItem(key); // fallback
      if (val) values.push(val);
    }
    return values.join("\n");
  };

  const generateDaftarPustaka = async () => {
    // 🔹 Ambil semua BAB 1-4
    const bab1 = await getBabData([
      "skripsi_latarBelakang",
      "skripsi_rumusanMasalah",
      "skripsi_tujuanPenelitian",
      "skripsi_manfaatPenelitian",
      "skripsi_ruangLingkup",
    ]);
    const bab2 = await getBabData([
      "skripsi_kajianTeori",
      "skripsi_penelitianTerdahulu",
      "skripsi_kerangkaPemikiran",
      "skripsi_hipotesis",
    ]);
    const bab3 = await getBabData([
      "skripsi_jenisPendekatan",
      "skripsi_lokasiWaktu",
      "skripsi_populasiSampel",
      "skripsi_teknikPengumpulan",
      "skripsi_instrumen",
      "skripsi_validitasReliabilitas",
      "skripsi_teknikAnalisis",
      "skripsi_prosedurPenelitian",
      "skripsi_jadwalPenelitian",
    ]);
    const bab4 = await getBabData([
      "skripsi_gambaranUmum",
      "skripsi_penyajianData",
      "skripsi_analisisDataKuantitatif",
      "skripsi_analisisDataKualitatif",
      "skripsi_pembahasan1",
      "skripsi_pembahasan2",
      "skripsi_pembahasan3",
    ]);

    // 🔹 Validasi tetap ada
    if (!bab1 || !bab2 || !bab3 || !bab4) {
      alert("BAB 1–4 belum lengkap. Silakan lengkapi semua bagian.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/generate-daftar-pustaka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bab1, bab2, bab3, bab4 }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const refs = Array.isArray(data.daftarPustaka) ? data.daftarPustaka : [];

      setDaftarPustaka(refs);
      await saveField("skripsi_daftarPustaka", refs); // 🔹 Simpan ke Firestore
      localStorage.setItem("skripsi_daftarPustaka", JSON.stringify(refs)); // 🔹 Fallback
    } catch (err) {
      console.error("❌ Gagal generate daftar pustaka:", err);
      alert("Gagal menghubungi server daftar pustaka.");
    } finally {
      setLoading(false);
    }
  };

  const exportDaftarPustaka = () => {
    if (!daftarPustaka.length) return;
    const text = daftarPustaka
      .map(
        (r, i) =>
          `${i + 1}. ${r.title || "Tanpa Judul"}\n   ${
            r.author || "Anonim"
          }\n   ${r.link ? `🔗 ${r.link}` : ""}\n`
      )
      .join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "Daftar_Pustaka_Skripsi.txt");
  };

  const hapusDaftarPustaka = async () => {
    if (!window.confirm("Hapus semua daftar pustaka?")) return;
    setDaftarPustaka([]);
    localStorage.removeItem("skripsi_daftarPustaka");
    await saveField("skripsi_daftarPustaka", []);
  };

  return (
    <div className="bg-none rounded-2xl p-6 md:p-8 space-y-6">
      <h3 className="text-xl font-semibold text-slate-100 mb-5 flex items-center gap-2">
        <BookOpenCheck className="w-5 h-5 text-primary" />
        Daftar Pustaka Otomatis
      </h3>

      <button
        onClick={generateDaftarPustaka}
        disabled={loading}
        className="bg-gradient-to-r from-slate-700 to-slate-600 hover:brightness-110 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            Sedang memproses...
          </>
        ) : (
          <>
            <SearchCheck className="w-4 h-4" />
            Generate Daftar Pustaka
          </>
        )}
      </button>

      {daftarPustaka.length > 0 && (
        <div className="mt-6 space-y-4 max-h-96 overflow-y-auto">
          {daftarPustaka.map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-neutral-900/80 rounded-xl border border-neutral-700"
            >
              <h4 className="font-semibold text-white">
                {idx + 1}. {item.title || "Tanpa Judul"}
              </h4>
              <p className="text-sm text-zinc-300 flex items-center gap-1">
                <FileText className="w-4 h-4" /> {item.author || "Anonim"}
              </p>
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all flex items-center gap-1"
                >
                  <Download className="w-4 h-4" /> {item.link}
                </a>
              )}
            </div>
          ))}

          <button
            onClick={exportDaftarPustaka}
            className="w-full mt-6 bg-primary text-black py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download
          </button>

          <button
            onClick={hapusDaftarPustaka}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Hapus Semua
          </button>
        </div>
      )}
    </div>
  );
}
