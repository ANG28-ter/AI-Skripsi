import React from "react";

export default function ResultItem({ label, value }) {
  return (
    <div className="bg-surfaceDark/80 backdrop-blur-md p-4 rounded-xl text-sm shadow-lg">
      <h3 className="font-semibold text-primary mb-1 uppercase tracking-wide text-xs">
        {label}
      </h3>
      <p className="text-zinc-300 whitespace-pre-line leading-relaxed">
        {typeof value === "string" ? value : "Belum ada data."}
      </p>
    </div>
  );
}
