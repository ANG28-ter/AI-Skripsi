import React, { useState, useMemo, useEffect, useRef } from "react";
import LatihanEditor from "/src/components/LatihanEditor";
import EvaluasiBox from "/src/components/EvaluasiBox";
import PlagiarismChecker from "/src/components/PlagiarismChecker";
import TanyaAIInline from "/src/components/TanyaAi";
import { Send } from "lucide-react";
import MarkdownParagraphFadeIn from "./MarkdownParagraphFadeIn";
import { saveField } from "../services/firestoreService";
import { useNavigate } from "react-router-dom";

const fixSpacing = (text) => text.replace(/([a-z])\n(?=[A-Z])/g, "$1\n\n");

export default function SkripsiSection({
  title,
  aiOutput,
  penjelasan,
  setMode,
  topik = "",
  subbabMap = {},
}) {
  const [userText, setUserText] = useState("");
  const [evaluasi, setEvaluasi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [proofreadResult, setProofreadResult] = useState("");
  const [loadingProofread, setLoadingProofread] = useState(false);
  const [contoh, setContoh] = useState("");

  const saveTimeout = useRef(null);
  const navigate = useNavigate();

  // ====== IDENTITAS BAB / SUBBAB ======
  const babId = useMemo(() => {
    const t = title?.trim() || "";
    const subMatch = t.match(/^(\d+\.\d+)\s+(.*)/);
    if (subMatch) {
      const babNum = subMatch[1].split(".")[0];
      const safe = t
        .replace(/\s+/g, "_")
        .toLowerCase()
        .replace(/[^\w_.-]/g, "");
      return `bab${babNum}_${safe}`;
    }
    const match = t.match(/^(\d+)/);
    return match ? `bab${match[1]}` : "bab1";
  }, [title]);

  const isSubBab = useMemo(
    () => /^\d+\.\d+\s+/.test((title || "").trim()),
    [title]
  );

  const finalOutput = useMemo(() => fixSpacing(aiOutput || ""), [aiOutput]);

  // ====== PARSE SUBBAB DARI AI OUTPUT ======
  const parsedSubbabMap = useMemo(() => {
    const lines = (aiOutput || "").split("\n");
    const map = {};
    let currentKey = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      const match = trimmed.match(/^(\d+\.\d+)\s+(.*)/);
      if (match) {
        currentKey = `${match[1]} ${match[2]}`.trim();
        map[currentKey] = "";
      } else if (currentKey) {
        map[currentKey] += line + "\n";
      }
    });

    return map;
  }, [aiOutput]);

  // ====== AUTO-SAVE PER SUBBAB (ISOLASI) ======
  useEffect(() => {
    if (!userText) return;

    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        localStorage.setItem(`skripsi_${babId}`, JSON.stringify(userText));
        await saveField(babId, userText);
        console.log(`✅ Auto-saved ${babId} ke Firestore & localStorage`);
      } catch (err) {
        console.error(`❌ Gagal auto-save ${babId}:`, err);
      }
    }, 1500);

    return () => clearTimeout(saveTimeout.current);
  }, [userText, babId]);

  // ====== HANDLER ======
  const handleEvaluasi = async () => {
    if (!userText.trim()) return alert("Tulis dulu versi kamu.");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText, aiText: aiOutput }),
      });
      const data = await res.json();
      setEvaluasi(data.feedback || "Tidak ada evaluasi.");
    } catch (err) {
      console.error("Gagal evaluasi:", err);
      setEvaluasi("Gagal mengambil evaluasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleProofread = async () => {
    if (!userText.trim()) return alert("Tulis dulu teks yang ingin diperiksa.");
    setLoadingProofread(true);
    setProofreadResult("");
    try {
      const res = await fetch("http://localhost:3001/proofread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: userText }),
      });
      const data = await res.json();
      setProofreadResult(data.output || "Tidak ada perubahan.");
    } catch (err) {
      console.error("Gagal proofreading:", err);
      setProofreadResult("Terjadi kesalahan saat menghubungi server.");
    } finally {
      setLoadingProofread(false);
    }
  };

  const handleGetContoh = async () => {
    if (!aiOutput) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/contoh-penulisan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiOutput }),
      });
      const data = await res.json();
      setContoh(data.contoh || "Belum ada contoh tersedia.");
    } catch (err) {
      console.error("❌ Gagal ambil contoh:", err);
      setContoh("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto bg-surfaceDark/90 backdrop-blur-lg p-6 rounded-2xl shadow-lg space-y-6">
      {!aiOutput?.trim() ? (
        <p className="text-sm italic text-slate-300 bg-neutral-800/80 p-3 rounded-lg">
          <span className="font-semibold">Informasi:</span> Belum ada hasil dari
          AI untuk bagian ini.
        </p>
      ) : (
        <>
          <div className="mb-6 p-4 rounded-lg shadow-inner">
            <p className="text-sm font-semibold text-slate-300 mb-2">
              Hasil AI
            </p>

            {/* === RENDER SUBBAB + Tombol Tanya Dosen === */}
            {!isSubBab && Object.keys(parsedSubbabMap || {}).length > 0 ? (
              Object.entries(parsedSubbabMap).map(([judulSubbab, isi]) => {
                const subBabId = `${babId}_${judulSubbab}`
                  .replace(/\s+/g, "_")
                  .toLowerCase();

                return (
                  <div key={judulSubbab} className="mb-6 space-y-2">
                    <p className="text-md font-bold text-white mb-2">
                      {judulSubbab}
                    </p>
                    <MarkdownParagraphFadeIn content={isi} babId={subBabId} />

                    <button
                      onClick={() =>
                        navigate("/chat-dosen", {
                          state: {
                            contextType: "subbab",
                            contextKey: subBabId,
                            contextTitle: judulSubbab, // ✅ terbaca
                            contextText: isi, // ✅ isi subbab
                          },
                        })
                      }
                      className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:brightness-110 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow"
                    >
                      <Send className="w-4 h-4" />
                      Tanyakan ke Dosen AI
                    </button>
                  </div>
                );
              })
            ) : (
              <>
                <MarkdownParagraphFadeIn
                  content={finalOutput}
                  babId={babId}
                />
                {/* Jika single subbab → tetap kasih tombol Tanya Dosen */}
                <button
                  onClick={() =>
                    navigate("/chat-dosen", {
                      state: {
                        contextType: "subbab",
                        contextKey: babId,
                        contextTitle: title, // ✅ judul utama terbaca
                        contextText: finalOutput,
                      },
                    })
                  }
                  className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:brightness-110 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow"
                >
                  <Send className="w-4 h-4" />
                  Tanyakan ke Dosen AI
                </button>
              </>
            )}
          </div>

          <TanyaAIInline
            babText={aiOutput}
            storageKey={`tanya_ai_${babId
              .toLowerCase()
              .replace(/\s+/g, "_")
              .replace(/[^\w_]/g, "")}`}
          />
        </>
      )}
    </div>
  );
}
