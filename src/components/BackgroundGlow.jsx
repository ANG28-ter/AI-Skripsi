import React from "react";

export default function BackgroundTechGlow({ children, className = "" }) {
  return (
    <div className={`relative isolate overflow-hidden bg-[#0f1f28] text-white ${className}`}>
      {/* STRONG Glow Layer */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Intense Radial Glow Center */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-gradient-radial from-primary/50 via-primary/20 to-transparent blur-[250px] opacity-95 rounded-full  " />

        {/* Cyan-Blue Beam Bottom Right */}
        <div className="absolute bottom-[-100px] right-[-100px] w-[700px] h-[700px] bg-gradient-to-tr from-cyan-400/30 to-transparent blur-[200px] rotate-45 opacity-90" />

        {/* Violet Overlay Top Left */}
        <div className="absolute top-[-100px] left-[-50px] w-[900px] h-[600px] bg-gradient-to-br from-purple-500/30 to-transparent blur-[120px] opacity-80" />

        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" />

        {/* Optional: Noise texture for realism */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-soft-light" />
      </div>

      {/* Konten utama */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
