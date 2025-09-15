import React from "react";

export default function ResultItem({ label, value }) {
  return (
    <div className="bg-surfaceDark/80 backdrop-blur-md p-4 sm:p-5 rounded-xl text-sm shadow-md border border-white/5">
      {/* Label */}
      <h3 className="font-semibold text-primary mb-2 uppercase tracking-wide text-xs sm:text-sm">
        {label}
      </h3>

      {/* Value */}
      <p className="text-zinc-300 whitespace-pre-line leading-relaxed text-sm sm:text-base break-words">
        {typeof value === "string" && value.trim() !== ""
          ? value
          : "Belum ada data."}
      </p>
    </div>
  );
}
