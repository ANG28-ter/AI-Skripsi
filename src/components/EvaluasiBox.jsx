import React from "react";
import { Bot, CheckCircle2 } from "lucide-react";

export default function EvaluasiBox({ feedback }) {
  return (
    <div className="bg-surfaceDark/80 backdrop-blur-md p-5 rounded-2xl shadow-lg">
      <p className="text-green-400 text-sm font-semibold mb-3 flex items-center gap-2">
        <Bot className="w-4 h-4 text-green-400" />
        Feedback AI
      </p>
      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap flex items-start gap-3">
        <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 shrink-0" />
        <span>{feedback}</span>
      </p>
    </div>
  );
}