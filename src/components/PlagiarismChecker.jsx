import React, { useEffect, useState } from "react";
import { checkPlagiarismDummy } from "../utils/checkPlagiarismDummy";
import { SearchCheck, ShieldCheck } from "lucide-react";

export default function PlagiarismChecker({ text, auto = false }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (auto && text && text.trim().length > 10) {
      setResult(checkPlagiarismDummy(text));
    }
  }, [auto, text]);

  const handleCheck = () => {
    if (!text || text.trim().length < 10) {
      alert("Teks terlalu pendek untuk dicek.");
      return;
    }
    const output = checkPlagiarismDummy(text);
    setResult(output);
  };

  return (
    <div className="bg-surfaceDark/80 backdrop-blur-md p-6 rounded-2xl text-white space-y-4">
      {!auto && (
        <div className="flex justify-between items-center">
          <button
            onClick={handleCheck}
            className="text-sm text-slate-200 hover:text-white flex items-center gap-2"
          >
            <SearchCheck className="w-4 h-4" />
            Cek Kemiripan Teks
          </button>
        </div>
      )}

      {result && (
        <div className="bg-neutral-800/80 p-5 rounded-xl text-sm leading-relaxed shadow-inner">
          <p className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-300" />
            Hasil Pemeriksaan Kemiripan
          </p>
          <p>
            Skor Keunikan: <strong className="text-green-400">{result.score}%</strong>
          </p>
          <p className="italic text-slate-200 mt-1">{result.message}</p>
        </div>
      )}
    </div>
  );
}
