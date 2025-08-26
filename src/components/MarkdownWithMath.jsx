import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BlockMath, InlineMath } from "react-katex";
import 'katex/dist/katex.min.css';

export default function MarkdownWithMath({ content }) {
  if (!content) return null;

  // Bersihkan karakter \ di akhir baris yang sering bikin gagal render
  const cleanContent = content.replace(/\\\s*$/gm, "").trim();

  // Pecah berdasarkan [ ... ] atau pola rumus lain
  const parts = cleanContent.split(/(\[.*?\]|\(\\[^\)]+\)|\\frac.*|\\text\{.*?\}.*)/gs);

  return (
    <>
      {parts.map((part, idx) => {
        // [ ... ] → format utama
        const matchSquare = part.match(/^\s*\[\s*([\s\S]*?)\s*\]\s*$/);
        if (matchSquare) {
          const latex = matchSquare[1].trim();
          return latex.length < 20
            ? <InlineMath key={idx} math={latex} />
            : <BlockMath key={idx} math={latex} />;
        }

        // ( \sigma^2_{X_i} ) → inline
        const matchParen = part.match(/^\(\s*\\([^)]+)\s*\)$/);
        if (matchParen) {
          return <InlineMath key={idx} math={`\\${matchParen[1].trim()}`} />;
        }

        // Rumus LaTeX mentah (fallback)
        if (/\\frac|\\times|\\cdot|\\alpha|\\beta|\\gamma|\\sigma|\\mu|\\epsilon|\\chi|\\text|\^/.test(part)) {
          const latex = part.trim();
          return latex.length < 20
            ? <InlineMath key={idx} math={latex} />
            : <BlockMath key={idx} math={latex} />;
        }

        // Sisanya → markdown biasa
        return (
          <ReactMarkdown key={idx} remarkPlugins={[remarkGfm]}>
            {part}
          </ReactMarkdown>
        );
      })}
    </>
  );
}
