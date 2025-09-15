import React, { useState, useEffect, useRef } from "react";
import BabSelector from "/src/components/BabSelector";
import { strukturPenjelasan } from "/src/utils/strukturPenjelasan";
import SkripsiSection from "/src/components/SkripsiSection";
import PromptBuilder from "/src/components/PromptBuilder";
import FloatingModeSwitcher from "/src/components/ModeSwitcher";
import ChatDosenPembimbing from "/src/pages/ChatDosenPembimbing";
import DaftarPustakaGenerator from "/src/components/DaftarPustakaGenerator";
import ResultItem from "/src/components/ResultItem";
import FullSkripsiOutput from "/src/components/FullSkripsiOut";
import SectionContainer from "/src/components/SectionContainer";
import ActionButton from "/src/components/ActionButton";
import InputCard from "/src/components/InputCard";
import Navbar from "../components/Navbar";
import useSkripsiGenerator from "../hooks/useSkripsiGenerator";
import DataPenelitianInput from "/src/components/DataPenelitianInput";
import { useSkripsiData } from "/src/hooks/useSkripsiData";
import {
  loadField,
  saveField,
  deleteFieldData,
  clearFields,
} from "../services/firestoreService";
import { clearAllParaphrases } from "/src/services/paraphraseStore";
import { debugErrorMap } from "firebase/auth";
import { AlertCircle } from "lucide-react";

// Komponen untuk indikator loading dengan ikon premium
const LoadingSpinner = () => (
  <div className="flex items-center justify-center gap-3 mt-8 animate-pulse text-lg text-teal-300">
    <svg
      className="animate-spin h-6 w-6 text-teal-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <span>Sedang memproses</span>
  </div>
);

export default function SkripsiGenerator() {
  const initField = (key) => {
    try {
      const local = localStorage.getItem(`skripsi_${key}`);
      if (local) {
        return JSON.parse(local);
      }
    } catch (e) {
      console.warn(`⚠️ Gagal parse localStorage untuk ${key}:`, e);
    }
    return "";
  };

  // State (tetap sama seperti sebelumnya)
  // Input utama
  const [topik, setTopik] = useState(() => initField("topik", ""));
  const [jurusan, setJurusan] = useState(() => initField("jurusan", ""));
  const [results, setResults] = useState(() => initField("hasil_generate", []));
  const [selectedBab, setSelectedBab] = useState(() =>
    initField("selectedBab", "")
  );
  const [bab1Gabungan, setBab1Gabungan] = useState(() =>
    initField("bab1Gabungan", "")
  ); // Deprecated
  const [bab2, setBab2] = useState(() => initField("bab2", "")); // Deprecated
  const [bab3, setBab3] = useState(() => initField("bab3", "")); // Deprecated
  const [bab4, setBab4] = useState(() => initField("bab4", "")); // Deprecated
  const [bab5, setBab5] = useState(() => initField("bab5", "")); // Deprecated
  const [lastGeneratedBab, setLastGeneratedBab] = useState(() =>
    initField("lastGeneratedBab", null)
  );
  const fullOutputRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Detailed states for each sub-bab, used by FullSkripsiOutput
  const [latarBelakang, setLatarBelakang] = useState(() =>
    initField("latarBelakang", "")
  );
  const [rumusanMasalah, setRumusanMasalah] = useState(() =>
    initField("rumusanMasalah", "")
  );
  const [tujuanPenelitian, setTujuanPenelitian] = useState(() =>
    initField("tujuanPenelitian", "")
  );
  const [manfaatPenelitian, setManfaatPenelitian] = useState(() =>
    initField("manfaatPenelitian", "")
  );
  const [ruangLingkup, setRuangLingkup] = useState(() =>
    initField("ruangLingkup", "")
  );
  const [sistematikaPenulisan, setSistematikaPenulisan] = useState(() =>
    initField("sistematikaPenulisan", "")
  );

  // BAB 2
  const [kajianTeori, setKajianTeori] = useState(() =>
    initField("kajianTeori", "")
  );
  const [penelitianTerdahulu, setPenelitianTerdahulu] = useState(() =>
    initField("penelitianTerdahulu", "")
  );
  const [kerangkaPemikiran, setKerangkaPemikiran] = useState(() =>
    initField("kerangkaPemikiran", "")
  );
  const [hipotesis, setHipotesis] = useState(() => initField("hipotesis", ""));

  // BAB 3
  const [jenisPendekatan, setJenisPendekatan] = useState(() =>
    initField("jenisPendekatan", "")
  );
  const [lokasiWaktu, setLokasiWaktu] = useState(() =>
    initField("lokasiWaktu", "")
  );
  const [populasiSampel, setPopulasiSampel] = useState(() =>
    initField("populasiSampel", "")
  );
  const [teknikPengumpulan, setTeknikPengumpulan] = useState(() =>
    initField("teknikPengumpulan", "")
  );
  const [instrumen, setInstrumen] = useState(() => initField("instrumen", ""));
  const [teknikAnalisis, setTeknikAnalisis] = useState(() =>
    initField("teknikAnalisis", "")
  );
  const [validitasReliabilitas, setValiditasReliabilitas] = useState(() =>
    initField("validitasReliabilitas", "")
  );
  const [prosedurPenelitian, setProsedurPenelitian] = useState(() =>
    initField("prosedurPenelitian", "")
  );
  const [jadwalPenelitian, setJadwalPenelitian] = useState(() =>
    initField("jadwalPenelitian", "")
  );

  // BAB 4
  const [gambaranUmum, setGambaranUmum] = useState(() =>
    initField("gambaranUmum", "")
  );
  const [penyajianData, setPenyajianData] = useState(() =>
    initField("penyajianData", "")
  );
  const [pembahasan1, setPembahasan1] = useState(() =>
    initField("pembahasan1", "")
  );
  const [pembahasan2, setPembahasan2] = useState(() =>
    initField("pembahasan2", "")
  );
  const [pembahasan3, setPembahasan3] = useState(() =>
    initField("pembahasan3", "")
  );
  const [analisisDataKuantitatif, setAnalisisDataKuantitatif] = useState(() =>
    initField("analisisDataKuantitatif", "")
  );
  const [analisisDataKualitatif, setAnalisisDataKualitatif] = useState(() =>
    initField("analisisDataKualitatif", "")
  );
  const [dataPenelitian, setDataPenelitian] = useState(() =>
    initField("dataPenelitian", "")
  );
  const [tipePenelitian, setTipePenelitian] = useState(() =>
    initField("tipePenelitian", "kuantitatif")
  );

  // BAB 5
  const [bab5_1, setBab5_1] = useState(() => initField("bab5_1", ""));
  const [bab5_2, setBab5_2] = useState(() => initField("bab5_2", ""));
  const [bab5_3, setBab5_3] = useState(() => initField("bab5_3", ""));
  const [bab5_4, setBab5_4] = useState(() => initField("bab5_4", ""));

  // Utility states
  const isValidInput = topik.trim().split(" ").length >= 5 && jurusan;
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState("quick");

  const key = `hasil_generate_${jurusan}_${topik}`;
  const selected = results[selectedIndex];

  const skripsi = useSkripsiGenerator(
    topik,
    jurusan,
    results,
    selectedIndex,
    setLoading
  );

  const loadWithFallback = async (key) => {
    try {
      const data = await loadField(key);
      if (data) return data;

      const local = localStorage.getItem(`skripsi_${key}`);
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          return local; // fallback string
        }
      }
      return "";
    } catch (e) {
      console.error(`❌ Gagal load field ${key}:`, e);
      return "";
    }
  };

  const simpanSemuaKeFirestore = async (data) => {
    try {
      const entries = Object.entries(data);
      await Promise.all(entries.map(([key, value]) => saveField(key, value)));
      console.log("✅ Semua data berhasil disimpan ke Firestore.");
    } catch (err) {
      console.error("❌ Gagal menyimpan semua data:", err);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const hasilData = {
        topik,
        jurusan,
        latarBelakang,
        rumusanMasalah,
        tujuanPenelitian,
        manfaatPenelitian,
        ruangLingkup,
        sistematikaPenulisan,
        kajianTeori,
        penelitianTerdahulu,
        kerangkaPemikiran,
        hipotesis,
        jenisPendekatan,
        lokasiWaktu,
        populasiSampel,
        teknikPengumpulan,
        instrumen,
        teknikAnalisis,
        validitasReliabilitas,
        prosedurPenelitian,
        jadwalPenelitian,
        gambaranUmum,
        penyajianData,
        analisisDataKuantitatif,
        analisisDataKualitatif,
        pembahasan1,
        pembahasan2,
        pembahasan3,
        bab5_1,
        bab5_2,
        bab5_3,
        bab5_4,
        hasil_generate: results,
      };

      // ⏳ Simpan ke Firestore
      simpanSemuaKeFirestore(hasilData);

      // 🗂 Simpan juga ke localStorage dengan prefix aman "skripsi_"
      Object.entries(hasilData).forEach(([key, val]) => {
        try {
          if (val && String(val).trim()) {
            localStorage.setItem(`skripsi_${key}`, JSON.stringify(val));
          }
        } catch (err) {
          console.warn("⚠️ Gagal menyimpan ke localStorage:", key, err);
        }
      });
    }, 3000); // debounce lebih panjang

    return () => clearTimeout(timeout);
  }, [
    topik,
    jurusan,
    latarBelakang,
    rumusanMasalah,
    tujuanPenelitian,
    manfaatPenelitian,
    ruangLingkup,
    sistematikaPenulisan,
    kajianTeori,
    penelitianTerdahulu,
    kerangkaPemikiran,
    hipotesis,
    jenisPendekatan,
    lokasiWaktu,
    populasiSampel,
    teknikPengumpulan,
    instrumen,
    teknikAnalisis,
    validitasReliabilitas,
    prosedurPenelitian,
    jadwalPenelitian,
    gambaranUmum,
    penyajianData,
    analisisDataKuantitatif,
    analisisDataKualitatif,
    pembahasan1,
    pembahasan2,
    pembahasan3,
    bab5_1,
    bab5_2,
    bab5_3,
    bab5_4,
    results,
  ]);

  useEffect(() => {
    const fetchHasilGenerate = async () => {
      try {
        const data = await loadWithFallback("hasil_generate");
        if (data) {
          setResults(data);
          setSelectedIndex(0);
        } else {
          // fallback ke localStorage prefix baru
          const local = localStorage.getItem("hasil_generate");
          if (local) {
            try {
              setResults(JSON.parse(local));
              setSelectedIndex(0);
            } catch (e) {
              console.warn("⚠️ Gagal parse localStorage hasil_generate:", e);
            }
          }
        }
      } catch (err) {
        console.error("❌ Gagal load hasil_generate dari Firestore:", err);
      }
    };

    fetchHasilGenerate();
  }, []);

  const aiOutputMap = {
    "1.1 Latar Belakang": latarBelakang || initField("latarBelakang", ""),
    "1.2 Rumusan Masalah": rumusanMasalah || initField("rumusanMasalah", ""),
    "1.3 Tujuan Penelitian":
      tujuanPenelitian || initField("tujuanPenelitian", ""),
    "1.4 Manfaat Penelitian":
      manfaatPenelitian || initField("manfaatPenelitian", ""),
    "1.5 Ruang Lingkup": ruangLingkup || initField("ruangLingkup", ""),
    "1.6 Sistematika Penulisan":
      sistematikaPenulisan || initField("sistematikaPenulisan", ""),

    "2.1 Kajian Teori": kajianTeori || initField("kajianTeori", ""),
    "2.2 Penelitian Terdahulu":
      penelitianTerdahulu || initField("penelitianTerdahulu", ""),
    "2.3 Kerangka Pemikiran":
      kerangkaPemikiran || initField("kerangkaPemikiran", ""),
    "2.4 Hipotesis": hipotesis || initField("hipotesis", ""),

    "3.1 Jenis dan Pendekatan":
      jenisPendekatan || initField("jenisPendekatan", ""),
    "3.2 Lokasi dan Waktu": lokasiWaktu || initField("lokasiWaktu", ""),
    "3.3 Populasi dan Sampel":
      populasiSampel || initField("populasiSampel", ""),
    "3.4 Teknik Pengumpulan Data":
      teknikPengumpulan || initField("teknikPengumpulan", ""),
    "3.5 Instrumen Penelitian": instrumen || initField("instrumen", ""),
    "3.6 Uji Validitas dan Realibilitas":
      validitasReliabilitas || initField("validitasReliabilitas", ""),
    "3.7 Teknik Analisis Data":
      teknikAnalisis || initField("teknikAnalisis", ""),
    "3.8 Prosedur Penelitian":
      prosedurPenelitian || initField("prosedurPenelitian", ""),
    "3.9 Jadwal Penelitian":
      jadwalPenelitian || initField("jadwalPenelitian", ""),

    "4.1 Gambaran Umum Objek Penelitian":
      gambaranUmum || initField("gambaranUmum", ""),
    "4.2 Penyajian Data": penyajianData || initField("penyajianData", ""),
    "4.3.1.1 Analisis Data Kuantitatif":
      analisisDataKuantitatif || initField("analisisDataKuantitatif", ""),
    "4.3.1.2 Analisis Data Kualitatif":
      analisisDataKualitatif || initField("analisisDataKualitatif", ""),
    "4.4.1 Hubungan Hasil Penelitian dengan Teori":
      pembahasan1 || initField("pembahasan1", ""),
    "4.4.2 Pembahasan Temuan Unik atau Anomali":
      pembahasan2 || initField("pembahasan2", ""),
    "4.4.3 Perbandingan dengan Penelitian Sebelumnya":
      pembahasan3 || initField("pembahasan3", ""),

    "5.1 Kesimpulan": bab5_1 || initField("bab5_1", ""),
    "5.2 Saran": bab5_2 || initField("bab5_2", ""),
    "5.3 ...": bab5_3 || initField("bab5_3", ""),
    "5.4 ...": bab5_4 || initField("bab5_4", ""),
  };

  // Helper (tetap sama)
  const allSetters = [
    setResults,
    setBab1Gabungan,
    setBab2,
    setBab3,
    setBab4,
    setBab5,
    setLatarBelakang,
    setRumusanMasalah,
    setTujuanPenelitian,
    setManfaatPenelitian,
    setRuangLingkup,
    setSistematikaPenulisan,
    setKajianTeori,
    setPenelitianTerdahulu,
    setKerangkaPemikiran,
    setHipotesis,
    setJenisPendekatan,
    setLokasiWaktu,
    setPopulasiSampel,
    setTeknikPengumpulan,
    setInstrumen,
    setTeknikAnalisis,
    setValiditasReliabilitas,
    setProsedurPenelitian,
    setJadwalPenelitian,
    setGambaranUmum,
    setPenyajianData,
    setAnalisisDataKuantitatif,
    setAnalisisDataKualitatif,
    setPembahasan1,
    setPembahasan2,
    setPembahasan3,
    setBab5_1,
    setBab5_2,
    setBab5_3,
    setBab5_4,
  ];

  // Helper untuk clear semua localStorage yang pakai prefix "skripsi_"
  const hapusSemuaLocalSkripsi = () => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("skripsi_"))
      .forEach((k) => localStorage.removeItem(k));
  };

  const hapusSemuaHasil = async () => {
    if (!confirm("Yakin ingin menghapus semua hasil?")) return;
    setLoading(true);
    try {
      const keys = [
        "topik",
        "jurusan",
        "latarBelakang",
        "rumusanMasalah",
        "tujuanPenelitian",
        "manfaatPenelitian",
        "ruangLingkup",
        "sistematikaPenulisan",
        "kajianTeori",
        "penelitianTerdahulu",
        "kerangkaPemikiran",
        "hipotesis",
        "jenisPendekatan",
        "lokasiWaktu",
        "populasiSampel",
        "teknikPengumpulan",
        "instrumen",
        "teknikAnalisis",
        "validitasReliabilitas",
        "prosedurPenelitian",
        "jadwalPenelitian",
        "gambaranUmum",
        "penyajianData",
        "analisisDataKuantitatif",
        "analisisDataKualitatif",
        "pembahasan1",
        "pembahasan2",
        "pembahasan3",
        "bab5_1",
        "bab5_2",
        "bab5_3",
        "bab5_4",
        "hasil_generate",
        "paraphrases",
      ];

      // Hapus dari Firestore
      await clearFields(keys);

      // Hapus semua paraphrase (Firestore/local)
      await clearAllParaphrases();

      // 🔑 Hapus semua cache localStorage skripsi
      hapusSemuaLocalSkripsi();

      alert("✅ Semua hasil berhasil dihapus!");
      window.location.reload();
    } catch (err) {
      console.error("❌ Gagal hapus semua hasil:", err);
      alert("❌ Gagal hapus semua hasil.");
    }
  };

  // Prompt builder (mode prompt) (tetap sama)
  const handlePromptGenerate = async (prompt, bagian) => {
    try {
      const res = await fetch("http://localhost:3001/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      switch (bagian) {
        case "Latar Belakang":
          setLatarBelakang(data.output || "Gagal.");
          break;
        case "Rumusan Masalah":
          setRumusanMasalah(data.output || "Gagal.");
          break;
        case "Tujuan Penelitian":
          setTujuanPenelitian(data.output || "Gagal.");
          break;
        case "Kajian Teori":
          setKajianTeori(data.output || "Gagal.");
          break;
        case "Kesimpulan":
          setBab5_1(data.output || "Gagal.");
          break;
        default:
          alert("Bagian tidak dikenali.");
      }
    } catch (err) {
      console.error("Gagal generate:", err);
    }
  };

  useEffect(() => {
    const loadData = async (key, setter) => {
      try {
        const data = await loadField(key);
        if (data !== null && data !== undefined) {
          setter(data);
        }
      } catch (err) {
        console.error(`❌ Gagal load ${key} dari Firestore:`, err.message);
      }
    };

    const fetchAllData = async () => {
      await loadData("topik", setTopik);
      await loadData("jurusan", setJurusan);

      const mappings = [
        ["latarBelakang", setLatarBelakang],
        ["rumusanMasalah", setRumusanMasalah],
        ["tujuanPenelitian", setTujuanPenelitian],
        ["manfaatPenelitian", setManfaatPenelitian],
        ["ruangLingkup", setRuangLingkup],
        ["sistematikaPenulisan", setSistematikaPenulisan],
        ["kajianTeori", setKajianTeori],
        ["penelitianTerdahulu", setPenelitianTerdahulu],
        ["kerangkaPemikiran", setKerangkaPemikiran],
        ["hipotesis", setHipotesis],
        ["jenisPendekatan", setJenisPendekatan],
        ["lokasiWaktu", setLokasiWaktu],
        ["populasiSampel", setPopulasiSampel],
        ["teknikPengumpulan", setTeknikPengumpulan],
        ["instrumen", setInstrumen],
        ["teknikAnalisis", setTeknikAnalisis],
        ["validitasReliabilitas", setValiditasReliabilitas],
        ["prosedurPenelitian", setProsedurPenelitian],
        ["jadwalPenelitian", setJadwalPenelitian],
        ["gambaranUmum", setGambaranUmum],
        ["penyajianData", setPenyajianData],
        ["analisisDataKuantitatif", setAnalisisDataKuantitatif],
        ["analisisDataKualitatif", setAnalisisDataKualitatif],
        ["pembahasan1", setPembahasan1],
        ["pembahasan2", setPembahasan2],
        ["pembahasan3", setPembahasan3],
        ["bab5_1", setBab5_1],
        ["bab5_2", setBab5_2],
        ["bab5_3", setBab5_3],
        ["bab5_4", setBab5_4],
      ];

      await Promise.all(mappings.map(([key, setter]) => loadData(key, setter)));

      await loadData("hasil_generate", (hasil) => {
        setResults(hasil);
        setSelectedIndex(0);
      });
    };
    fetchAllData();
  }, []);

  // Generate Skripsi (tetap sama)
  const generate = () => skripsi.generate(setResults, setSelectedIndex);

  // ✅ Generate BAB I Lengkap
  const generateBab1Full = async () => {
    setIsGenerating(true);
    await skripsi.generateBabFull([
      () => skripsi.generateLatarBelakang(setLatarBelakang),
      () => skripsi.generateRumusanMasalah(setRumusanMasalah),
      () => skripsi.generateTujuanPenelitian(setTujuanPenelitian),
      () => skripsi.generateManfaatPenelitian(setManfaatPenelitian),
      () => skripsi.generateRuangLingkup(setRuangLingkup),
    ]);
    setIsGenerating(false);
  };

  // ✅ Generate BAB II
  const generateBab2Full = async () => {
    setIsGenerating(true);
    await skripsi.generateBabFull([
      () => skripsi.generateKajianTeori(setKajianTeori),
      () => skripsi.generatePenelitianTerdahulu(setPenelitianTerdahulu),
      () => skripsi.generateKerangkaPemikiran(setKerangkaPemikiran),
      () => skripsi.generateHipotesis(setHipotesis),
    ]);
    setIsGenerating(false);
  };

  // ✅ Generate BAB III
  const generateBab3Full = async () => {
    setIsGenerating(true);
    await skripsi.generateBabFull([
      () => skripsi.generateJenisPenelitian(setJenisPendekatan),
      () => skripsi.generateLokasiWaktu(setLokasiWaktu),
      () => skripsi.generatePopulasiSampel(setPopulasiSampel),
      () => skripsi.generateTeknikPengumpulan(setTeknikPengumpulan),
      () => skripsi.generateInstrumen(setInstrumen),
      () => skripsi.generateTeknikAnalisis(setTeknikAnalisis),
      () => skripsi.generateValiditasReliabilitas(setValiditasReliabilitas),
      () => skripsi.generateProsedurPenelitian(setProsedurPenelitian),
      () => skripsi.generateJadwalPenelitian(setJadwalPenelitian),
    ]);
    setIsGenerating(false);
  };

  // ✅ Generate BAB IV
  const generateBab4Full = async () => {
    setIsGenerating(true);
    await skripsi.generateBabFull([
      () => skripsi.generateGambaranUmum(setGambaranUmum),
      () => skripsi.generatePenyajianData(setPenyajianData),
      () => skripsi.generateAnalisisKuantitatif(setAnalisisDataKuantitatif),
      () => skripsi.generateAnalisisKualitatif(setAnalisisDataKualitatif),
      () =>
        skripsi.generatePembahasanSubAll(
          setPembahasan1,
          setPembahasan2,
          setPembahasan3
        ),
    ]);
    setIsGenerating(false);
  };

  // ✅ Generate BAB V
  const generateBab5 = async () => {
    setIsGenerating(true);
    await skripsi.generateBab5({
      bab5_1: setBab5_1,
      bab5_2: setBab5_2,
      bab5_3: setBab5_3,
      bab5_4: setBab5_4,
    });
    setIsGenerating(false);
  };

  const generateAnalisisDariData = async () => {
    if (!selectedBab || !selectedBab.startsWith("4.")) {
      alert("Fitur ini hanya untuk BAB IV.");
      return;
    }

    if (!dataPenelitian || dataPenelitian.trim().length < 10) {
      alert("Data penelitian masih kosong atau tidak valid.");
      return;
    }

    setIsGenerating(true);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bab: "analisis-dari-data",
          topik,
          jurusan,
          tipePenelitian,
          data: dataPenelitian,
          bagian: selectedBab,
        }),
      });

      const result = await res.json();
      const output = result.output || "Gagal memproses data.";

      const saveData = async (key, value) => {
        try {
          await saveField(`skripsi_${key}`, value);
        } catch (err) {
          console.error(`❌ Gagal simpan ${key} ke Firestore:`, err);
        }
      };

      if (selectedBab.includes("4.1")) {
        setGambaranUmum(output);
        saveData("gambaranUmum", output);
      } else if (selectedBab.includes("4.2")) {
        setPenyajianData(output);
        saveData("penyajianData", output);
      } else if (selectedBab.includes("4.3.1.1")) {
        setAnalisisDataKuantitatif(output);
        saveData("analisisDataKuantitatif", output);
      } else if (selectedBab.includes("4.3.1.2")) {
        setAnalisisDataKualitatif(output);
        saveData("analisisDataKualitatif", output);
      } else if (selectedBab.includes("4.4.1")) {
        setPembahasan1(output);
        saveData("pembahasan1", output);
      } else if (selectedBab.includes("4.4.2")) {
        setPembahasan2(output);
        saveData("pembahasan2", output);
      } else if (selectedBab.includes("4.4.3")) {
        setPembahasan3(output);
        saveData("pembahasan3", output);
      } else {
        alert("Bagian BAB IV tidak dikenali. Output tidak disimpan.");
      }
    } catch (error) {
      console.error("Gagal generate:", error);
      alert("Terjadi kesalahan saat memproses data.");
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  // Data structure for FullSkripsiOutput
  const bab1Data = {
    latarBelakang,
    rumusanMasalah,
    tujuanPenelitian,
    manfaatPenelitian,
    ruangLingkup,
    sistematikaPenulisan,
  };
  const bab2Data = {
    kajianTeori,
    penelitianTerdahulu,
    kerangkaPemikiran,
    hipotesis,
  };
  const bab3Data = {
    jenisPendekatan,
    lokasiWaktu,
    populasiSampel,
    teknikPengumpulan,
    instrumen,
    validitasReliabilitas,
    teknikAnalisis,
    prosedurPenelitian,
    jadwalPenelitian,
  };
  const bab4Data = {
    gambaranUmum,
    penyajianData,
    analisisDataKuantitatif,
    analisisDataKualitatif,
    pembahasan1,
    pembahasan2,
    pembahasan3,
  };

  const bab5Data = { bab5_1, bab5_2, bab5_3, bab5_4 };

  const renderListOrText = (value) => {
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    }
    return value || "Belum ada data.";
  };

  // Render
  return (
    <div className="relative z-10 min-h-screen">
      <Navbar />
      <div className="text-center text-white py-12 md:py-4 px-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-white">
          <span className="bg-gradient-to-r from-white via-primary to-cyan-400 bg-clip-text text-transparent">
            Skripsi
          </span>
        </h1>
      </div>
      <p className="text-xl text-center md:text-2xl mt-6 text-zinc-400 max-w-2xl mx-auto">
        Bantu kamu menyelesaikan skripsi dari awal hingga selesai dengan
        teknologi AI.
      </p>
      <div className="max-w-screen-lg mx-auto space-y-10">
        <FloatingModeSwitcher mode={mode} setMode={setMode} />

        {mode === "quick" && (
          <>
            <div className="w-full">
              <InputCard
                topik={topik}
                setTopik={setTopik}
                jurusan={jurusan}
                setJurusan={setJurusan}
              />

              <div className="p-3 text-red-300 text-xs mx-auto max-w-3xl">
                {/* Warning kecil */}
                <p className="mt-3 flex items-start gap-2 text-xs sm:text-sm text-yellow-400 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/30">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    AI dapat memberikan saran yang tidak selalu akurat. Mohon
                    verifikasi ulang sebelum digunakan.
                  </span>
                </p>
              </div>

              {/* Tombol Generate */}
              <div className="max-w-3xl mx-auto mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
                <ActionButton
                  onClick={generate}
                  label="Cari"
                  loading={loading}
                  color="primary"
                />
                <ActionButton
                  onClick={generateBab1Full}
                  label="BAB I"
                  loading={loading}
                  color="secondary"
                />
                <ActionButton
                  onClick={generateBab2Full}
                  label="BAB II"
                  loading={loading}
                  color="secondary"
                />
                <ActionButton
                  onClick={generateBab3Full}
                  label="BAB III"
                  loading={loading}
                  color="secondary"
                />
                <ActionButton
                  onClick={generateBab4Full}
                  label="BAB IV"
                  loading={loading}
                  color="secondary"
                />
                <ActionButton
                  onClick={generateBab5}
                  label="BAB V"
                  loading={loading}
                  color="secondary"
                />
              </div>

              {/* Tombol Hapus */}
              <div className="max-w-3xl mx-auto mt-6 flex justify-end px-2">
                <ActionButton
                  onClick={hapusSemuaHasil}
                  label="Hapus Semua"
                  color="danger"
                />
                {loading && (
                  <ActionButton
                    onClick={skripsi.cancelGenerate}
                    label="Batalkan"
                    color=""
                  />
                )}
              </div>
            </div>

            {loading && <LoadingSpinner />}

            {results.length > 0 && (
              <SectionContainer title="">
                {results.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {results.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedIndex(idx)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          idx === selectedIndex
                            ? "bg-slate-800 text-white shadow-md"
                            : "bg-neutral-700 text-white hover:bg-neutral-600"
                        }`}
                      >
                        Hasil {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-4 text-sm">
                  <ResultItem
                    label="Judul"
                    value={selected?.judul || "Belum ada data."}
                  />
                  <ResultItem
                    label="Rumusan Masalah"
                    value={
                      Array.isArray(selected?.rumusan)
                        ? selected.rumusan.join("\n")
                        : selected?.rumusan || "Belum ada data."
                    }
                  />
                  <ResultItem
                    label="Tujuan"
                    value={
                      Array.isArray(selected?.tujuan)
                        ? selected.tujuan.join("\n")
                        : selected?.tujuan || "Belum ada data."
                    }
                  />
                  <ResultItem
                    label="Referensi"
                    value={
                      Array.isArray(selected?.referensi)
                        ? selected.referensi.join("\n")
                        : selected?.referensi || "Belum ada data."
                    }
                  />
                  <ResultItem
                    label="Abstrak"
                    value={selected?.abstrak || "Belum ada data."}
                  />
                </div>
              </SectionContainer>
            )}

            <FullSkripsiOutput
              bab1={bab1Data}
              bab2={bab2Data}
              bab3={bab3Data}
              bab4={bab4Data}
              bab5={bab5Data}
            />

            <SectionContainer>
              <BabSelector
                selectedBab={selectedBab}
                onChange={setSelectedBab}
              />
            </SectionContainer>

            <SectionContainer>
              <div className="mb-10">
                {selectedBab.startsWith("4.") && (
                  <>
                    <DataPenelitianInput
                      tipePenelitian={tipePenelitian}
                      setTipePenelitian={setTipePenelitian}
                      dataPenelitian={dataPenelitian}
                      setDataPenelitian={setDataPenelitian}
                    />
                    <div className="mt-4 flex justify-end">
                      <ActionButton
                        label="Generate dari Data Mahasiswa"
                        onClick={generateAnalisisDariData}
                        loading={loading}
                        color="accent"
                      />
                    </div>
                  </>
                )}
              </div>
              {selectedBab ? (
                <SkripsiSection
                  title={selectedBab}
                  aiOutput={aiOutputMap[selectedBab] || ""}
                  penjelasan={
                    strukturPenjelasan[selectedBab] || ["Belum ada penjelasan."]
                  }
                  topik={results[selectedIndex]?.judul || ""}
                  setMode={setMode}
                />
              ) : (
                <p className="text-sm text-center italic text-slate-400">
                  Silakan pilih salah satu BAB terlebih dahulu.
                </p>
              )}
            </SectionContainer>

            <DaftarPustakaGenerator />
          </>
        )}

        {mode === "prompt" && (
          <SectionContainer title="Gratis">
            <PromptBuilder onGenerate={handlePromptGenerate} />
          </SectionContainer>
        )}
      </div>
    </div>
  );
}
