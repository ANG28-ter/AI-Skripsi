// hooks/useSkripsiGenerator.js
import { useRef } from "react";
import { saveField } from "../services/firestoreService"; // pastikan path sesuai

const API = "http://localhost:3001";
const clean = (text) => (text || "").replace(/[#*]+/g, "").trim();

const useSkripsiGenerator = (
  topik,
  jurusan,
  results,
  selectedIndex,
  setLoading,
  setLastGeneratedBab
) => {
  const abortControllerRef = useRef(null);

  const postToGenerate = async (babParam, extraBody = {}) => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const payload = {
      topik: results[selectedIndex]?.judul,
      jurusan,
      bab: babParam,
      ...extraBody,
    };

    try {
      const res = await fetch(`${API}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal,
      });

      const text = await res.text();
      return JSON.parse(text);
    } catch (err) {
      if (err.name !== "AbortError") console.error("❌ Gagal fetch:", err);
      return {};
    }
  };

  const fetchAndStore = async (babParam, key, setter, extraBody = {}) => {
    if (!results[selectedIndex]) {
      alert("Pilih salah satu hasil terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      const data = await postToGenerate(babParam, extraBody);
      const value = data?.[key] ?? "";
      const cleaned = clean(value);

      setter(cleaned);
      await saveField(key, cleaned);
      await saveField("hasil_generate", results); // ✅ Tambahan agar hasil_generate ikut tersimpan setelah setiap bab

      setLastGeneratedBab?.(babParam);
    } catch (err) {
      if (err.name !== "AbortError")
        console.error(`❌ Gagal generate '${key}':`, err);
    } finally {
      setLoading(false);
    }
  };

  const generate = async (setResults, setSelectedIndex) => {
    if (!topik || !jurusan) return alert("Silakan isi topik dan jurusan.");

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    try {
      const res = await fetch(`${API}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topik, jurusan, bab: "skripsi-full" }),
        signal,
      });
      const data = await res.json();

      setResults(data.results || []);
      await saveField("hasil_generate", data.results || []);
      setSelectedIndex(0);
      setLastGeneratedBab?.("skripsi-full");
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Gagal mengambil data:", err);
        alert("Terjadi kesalahan. Coba lagi nanti.");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateBab = async (endpoint, labelMapping, setters) => {
    if (!results[selectedIndex]) {
      alert("Pilih salah satu hasil terlebih dahulu.");
      return;
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    try {
      const res = await fetch(`${API}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topik: results[selectedIndex]?.judul,
          jurusan,
          bab: endpoint,
        }),
        signal,
      });

      const text = await res.text();
      const data = JSON.parse(text);

      for (const [camelKey, labelKey] of Object.entries(labelMapping)) {
        const value = data?.[labelKey] ?? "";
        const cleaned = clean(value);
        setters[camelKey]?.(cleaned);
        await saveField(camelKey, cleaned);
      }

      setLastGeneratedBab?.(endpoint);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(`Gagal generate ${endpoint}:`, err);
        alert(`Terjadi kesalahan saat generate ${endpoint}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateBabFull = async (fns) => {
    if (!results[selectedIndex]) {
      alert("Pilih salah satu hasil terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      for (const fn of fns) await fn();
      setLastGeneratedBab?.("bab1");
    } catch (e) {
      console.error("Gagal generate BAB lengkap:", e);
      alert("Terjadi kesalahan saat generate BAB lengkap");
    } finally {
      setLoading(false);
    }
  };

  const cancelGenerate = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return {
    generate,
    cancelGenerate,
    generateBabFull,
    generateLatarBelakang: (set) =>
      fetchAndStore("latar-belakang", "latarBelakang", set),
    generateRumusanMasalah: (set) =>
      fetchAndStore("rumusan-masalah", "rumusanMasalah", set),
    generateTujuanPenelitian: (set) =>
      fetchAndStore("tujuan-penelitian", "tujuanPenelitian", set),
    generateManfaatPenelitian: (set) =>
      fetchAndStore("manfaat-penelitian", "manfaatPenelitian", set),
    generateRuangLingkup: (set) =>
      fetchAndStore("ruang-lingkup", "ruangLingkup", set),
    generateSistematikaPenulisan: (set) =>
      fetchAndStore("sistematika-penulisan", "sistematikaPenulisan", set),
    generateKajianTeori: (set) =>
      fetchAndStore("kajian-teori", "kajianTeori", set),
    generatePenelitianTerdahulu: (set) =>
      fetchAndStore("penelitian-terdahulu", "penelitianTerdahulu", set),
    generateKerangkaPemikiran: (set) =>
      fetchAndStore("kerangka-pemikiran", "kerangkaPemikiran", set),
    generateHipotesis: (set) => fetchAndStore("hipotesis", "hipotesis", set),
    generateJenisPenelitian: (set) =>
      fetchAndStore("jenis-pendekatan", "jenisPendekatan", set),
    generateLokasiWaktu: (set) =>
      fetchAndStore("lokasi-waktu", "lokasiWaktu", set),
    generatePopulasiSampel: (set) =>
      fetchAndStore("populasi-sampel", "populasiSampel", set),
    generateTeknikPengumpulan: (set) =>
      fetchAndStore("teknik-pengumpulan", "teknikPengumpulan", set),
    generateInstrumen: (set) =>
      fetchAndStore("instrumen-penelitian", "instrumen", set),
    generateTeknikAnalisis: (set) =>
      fetchAndStore("analisis-data", "teknikAnalisis", set),
    generateValiditasReliabilitas: (set) =>
      fetchAndStore("validitas-reliabilitas", "validitasReliabilitas", set),
    generateProsedurPenelitian: (set) =>
      fetchAndStore("prosedur-penelitian", "prosedurPenelitian", set),
    generateJadwalPenelitian: (set) =>
      fetchAndStore("jadwal-penelitian", "jadwalPenelitian", set),
    generateGambaranUmum: (set) =>
      fetchAndStore("gambaran-umum", "gambaranUmum", set),
    generatePenyajianData: (set) =>
      fetchAndStore("penyajian-data", "penyajianData", set),
    generateAnalisisKuantitatif: (set) =>
      fetchAndStore(
        "analisis-data-kuantitatif",
        "analisisDataKuantitatif",
        set
      ),
    generateAnalisisKualitatif: (set) =>
      fetchAndStore("analisis-data-kualitatif", "analisisDataKualitatif", set),
    generatePembahasanSubAll: (set1, set2, set3) => {
  return (async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topik: results[selectedIndex]?.judul,
          jurusan,
          bab: "pembahasan-sub",
          bagian: "all", // kirim all
        }),
      });
      const data = await res.json();

      if (data?.pembahasan1) {
        const cleaned = clean(data.pembahasan1);
        set1(cleaned);
        await saveField("pembahasan1", cleaned);
      }
      if (data?.pembahasan2) {
        const cleaned = clean(data.pembahasan2);
        set2(cleaned);
        await saveField("pembahasan2", cleaned);
      }
      if (data?.pembahasan3) {
        const cleaned = clean(data.pembahasan3);
        set3(cleaned);
        await saveField("pembahasan3", cleaned);
      }

      await saveField("hasil_generate", results);
    } catch (err) {
      console.error("❌ Gagal generate pembahasan all:", err);
    } finally {
      setLoading(false);
    }
  })();
},
    generateBab5: (setters) =>
      generateBab(
        "bab5",
        {
          bab5_1: "bab5_1",
          bab5_2: "bab5_2",
          bab5_3: "bab5_3",
          bab5_4: "bab5_4",
        },
        setters
      ),
  };
};

export default useSkripsiGenerator;
