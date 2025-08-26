import React, { useState, useEffect } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { saveParaphrase, getParaphrase } from "../services/paraphraseStore";
import MarkdownWithMath from "./MarkdownWithMath";

export default function ParagrafItem({
  text,
  index,
  isHeading,
  onParaphrased,
  babId,
  // === context ===
  prevText = "",
  nextText = "",
  babTitle = "",
  subBabTitle = "",
  topik = "",
  jurusan = "",
  paraphraseMap = {},
}) {
  const [paraphrased, setParaphrased] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const loadFromStore = async () => {
    if (isHeading || index == null) return;
    const saved = await getParaphrase(babId, index);
    if (saved) setParaphrased(saved);
  };

  // initial load
  useEffect(() => {
    loadFromStore();
  }, [index, isHeading, babId]); // :contentReference[oaicite:6]{index=6}

  // NEW: dengarkan broadcast supaya editor ikut refresh juga (bukan cuma read-only)
  useEffect(() => {
    if (isHeading || index == null) return;
    const key = `paragraf_${babId}_${index}`;
    if (paraphraseMap[key]) {
      setParaphrased(paraphraseMap[key]);
    }
  }, [paraphraseMap, babId, index, isHeading]);

  const isValidText = (str) => str && str.trim().length >= 30;

  const handleParaphrase = async () => {
    if (!isValidText(text)) {
      alert("Paragraf terlalu pendek untuk diparafrase.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("http://localhost:3001/paraphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: text,
          context: {
            babId,
            index,
            babTitle,
            subBabTitle,
            prevText,
            nextText,
            topik,
            jurusan,
          },
        }),
      });

      const result = await response.json();
      // NEW: terima dua format respons (baru & legacy)
      const newText =
        result.output ?? result.paraphrased ?? "⚠️ Tidak ada hasil parafrase.";

      // NEW: update state LOKAL dulu — biar UI berubah instan
      setParaphrased(newText);
      // kecilkan race condition: pastikan state commit
      await Promise.resolve();

      await saveParaphrase(babId, index, newText);

      // Broadcast update agar komponen lain ikut refresh
      window.dispatchEvent(new Event("paraphrase_updated"));

      if (onParaphrased) onParaphrased(index, newText);
    } catch (error) {
      console.error("❌ Gagal parafrase:", error);
      setErrorMsg("❌ Terjadi kesalahan saat memproses.");
      // jangan kosongkan state kalau sebelumnya sudah ada parafrase
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      {!isHeading && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={handleParaphrase}
            disabled={loading}
            className="bg-zinc-800 hover:bg-teal-600 border border-zinc-700 p-2 rounded-full text-white transition-all"
            title="Parafrase paragraf ini"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      <MarkdownWithMath content={paraphrased || text} />

      {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
    </div>
  );
}
