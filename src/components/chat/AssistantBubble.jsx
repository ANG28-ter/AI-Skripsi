// src/components/chat/AssistantBubble.jsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { GraduationCap } from "lucide-react";
import { fixSpacing } from "../../utils/chatUtils";

/**
 * Komponen untuk render balasan AI.
 * Bisa berupa segments (highlight, markdown, dsb) atau fallback ke markdown biasa.
 */
export default function AssistantBubble({ msg, index, onCopy, onRetry }) {
  if (!msg) return null;

  const renderSegments = () => (
    <div className="prose prose-invert text-sm leading-relaxed">
      {msg.segments.map((s, idx) => {
        if (s.type === "highlight") {
          const cls = `highlight-${s.color || "yellow"}`;
          return (
            <div key={`${index}-${idx}`} className="mb-1">
              <mark className={cls}>{s.text}</mark>
            </div>
          );
        }
        return (
          <div key={`${index}-${idx}`} className="mb-1">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {fixSpacing(s.text)}
            </ReactMarkdown>
          </div>
        );
      })}
    </div>
  );

  const renderLegacy = () => (
    <div className="prose prose-invert text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {fixSpacing(msg.content || "")}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="flex group justify-start">
      {/* Icon Profil Asisten */}
      <div className="flex-shrink-0 mr-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-cyan-400 shadow">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Bubble Chat */}
      <div className="max-w-[82%]">
        <div className="px-4 py-3 rounded-2xl text-neutral-100 bg-neutral-900/40">
          {msg.segments && Array.isArray(msg.segments)
            ? renderSegments()
            : renderLegacy()}
        </div>

        {/* Aksi hover: Copy & Retry */}
        <div className="mt-2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-neutral-400">
          <button
            onClick={() =>
              onCopy?.(
                msg.segments
                  ? msg.segments.map((s) => s.text).join("\n\n")
                  : msg.content || ""
              )
            }
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:text-emerald-300"
            title="Salin"
          >
            Salin
          </button>

          <button
            onClick={() => onRetry?.(index)}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:text-yellow-300"
            title="Ulangi"
          >
            Ulangi
          </button>
        </div>
      </div>
    </div>
  );
}
