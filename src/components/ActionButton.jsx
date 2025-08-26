import { Loader2, ArrowRight, Trash2, Sparkles } from "lucide-react";
import React from "react";

const variants = {
  primary:
    "bg-primary text-black hover:brightness-110 focus:ring-2 focus:ring-primary/50",
  danger:
    "bg-red-600 text-white hover:bg-red-500 focus:ring-2 focus:ring-red-500/50",
  secondary:
    "bg-zinc-700 text-white hover:bg-zinc-600 focus:ring-2 focus:ring-zinc-500/50",
  subtle:
    "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 focus:ring-2 focus:ring-zinc-500/30",
};

const defaultIcons = {
  primary: ArrowRight,
  danger: Trash2,
  secondary: Sparkles,
};

export default function ActionButton({
  label,
  onClick,
  loading = false,
  icon,
  color = "secondary",
  full = false,
}) {
  const Icon = icon || defaultIcons[color] || null;

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`group flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-md focus:outline-none tracking-wide
        ${variants[color] || variants.secondary}
        ${loading ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.02]"}
        ${full ? "w-full" : ""}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4 opacity-80 group-hover:opacity-100 transition-all" />
      )}
      <span>{label}</span>
    </button>
  );
}