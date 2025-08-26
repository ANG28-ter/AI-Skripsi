import React from "react";

export default function HighlightedText({ text }) {
  const highlights = ["tujuan", "masalah", "penelitian", "data", "urgensi"];
  const words = text.split(" ");
  return (
    <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
      {words.map((w, i) => {
        const match = highlights.find((h) => w.toLowerCase().includes(h));
        return match ? (
          <span
            key={i}
            className="bg-yellow-400/90 text-black px-1.5 py-0.5 rounded-md mx-0.5 shadow-sm"
          >
            {w}
          </span>
        ) : (
          <span key={i}> {w}</span>
        );
      })}
    </p>
  );
}