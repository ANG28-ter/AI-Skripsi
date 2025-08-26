import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  LoaderCircle,
  History,
  SendHorizonal,
  MessageSquareText,
  Trash2,
} from "lucide-react";

const TanyaAIInline = ({ babText, storageKey }) => {
  const [pertanyaan, setPertanyaan] = useState("");
  const [jawaban, setJawaban] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const fixSpacing = (text) => {
    if (!text) return "";
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/([^\n])\n([^\n])/g, "$1 $2")
      .replace(/([^\n])\n\n([^\n])/g, "$1\n\n$2")
      .trim();
  };

  useEffect(() => {
    if (!storageKey || typeof storageKey !== "string") return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch (e) {
      console.warn("❌ Gagal parse localStorage untuk TanyaAI:", e);
    }
  }, [storageKey]);

  useEffect(() => {
    if (storageKey && history.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(history));
    }
  }, [history, storageKey]);

  const handleKirim = async () => {
    if (!pertanyaan.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/tanya-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bab: babText, pertanyaan }),
      });
      const data = await res.json();
      const jawabanBaru = data.jawaban;
      setJawaban(jawabanBaru);
      setHistory((prev) => [...prev, { bab: babText, tanya: pertanyaan, jawab: jawabanBaru }]);
      setPertanyaan("");
    } catch (err) {
      setJawaban("❌ Gagal mengambil jawaban dari AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem(storageKey);
    setHistory([]);
    setJawaban("");
  };

  const currentHistory = history.filter((item) => item.bab === babText);

  return (
    <div className="mt-6 p-6 rounded-2xl space-y-4">
      <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
        <Bot className="w-5 h-5 text-slate-300" />
        Tanya AI
      </h3>

      <textarea
        className="w-full bg-zinc-800/80 backdrop-blur text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ring-primary placeholder:text-slate-400"
        rows={3}
        placeholder="Contoh: Apa hubungan teori ini dengan topik penelitian?"
        value={pertanyaan}
        onChange={(e) => setPertanyaan(e.target.value)}
      />

      <div className="flex justify-between items-center">
        <button
          className="flex items-center gap-2 bg-primary text-black font-medium px-5 py-2 rounded-xl transition duration-200 text-sm hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading || !pertanyaan.trim()}
          onClick={handleKirim}
        >
          <SendHorizonal className="w-4 h-4" />
          {loading ? "Menjawab..." : "Kirim"}
        </button>

        {loading && (
          <div className="flex items-center gap-2 text-slate-200 text-sm animate-pulse">
            <LoaderCircle className="w-4 h-4 animate-spin" />
            AI sedang berpikir...
          </div>
        )}
      </div>

      {jawaban && (
        <div className="bg-neutral-900/80 p-4 rounded-xl text-sm text-white shadow-inner">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {fixSpacing(jawaban)}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {currentHistory.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-slate-200 font-semibold text-sm flex items-center gap-2">
            <History className="w-4 h-4" />
            Riwayat Tanya AI
          </h4>

          {currentHistory.map((item, i) => (
            <div key={i} className="bg-neutral-800/80 backdrop-blur border border-neutral-700 p-4 rounded-xl space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
                <MessageSquareText className="w-4 h-4" /> Pertanyaan:
              </div>
              <div className="prose prose-invert max-w-none text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {fixSpacing(item.tanya)}
                </ReactMarkdown>
              </div>

              <div className="text-slate-200 text-sm font-medium mt-2 flex items-center gap-2">
                <Bot className="w-4 h-4" /> Jawaban:
              </div>
              <div className="prose prose-invert max-w-none text-sm bg-neutral-850 border border-slate-700 p-3 rounded-xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {fixSpacing(item.jawab)}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          <button
            onClick={handleClear}
            className="mt-2 text-xs text-red-400 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> Hapus Semua Riwayat
          </button>
        </div>
      )}
    </div>
  );
};

export default TanyaAIInline;
