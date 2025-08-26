import React from "react";

export default function LatihanEditor({ value, onChange }) {
  return (
    <div className="bg-none backdrop-blur-md p-6 rounded-2xl">
      <p className="text-sm text-slate-300 font-semibold mb-2 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Tulis Versi Kamu Sendiri:
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[120px] rounded-xl bg-zinc-800/80 backdrop-blur-md text-white text-sm p-4 focus:outline-none focus:ring-2 ring-primary placeholder:text-slate-400"
        placeholder="Tulis ulang versi kamu di sini..."
      />
    </div>
  );
}