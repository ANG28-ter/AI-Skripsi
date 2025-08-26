import React, { useMemo } from "react";
import ParagrafItemReadOnly from "./ParagrafItemReadOnly";
import { fixSpacing } from "/src/utils/fixSpacing";

export default function MarkdownParagraphFadeInReadOnly({ content, babId }) {
  const elements = useMemo(() => {
    const parts = fixSpacing(content)
  .split(/\n{2,}/g)
  .reduce((acc, part) => {
    const last = acc[acc.length - 1] || "";
    // Deteksi awal atau tengah tabel
    if (part.includes("|") && last.includes("|")) {
      acc[acc.length - 1] = `${last}\n\n${part}`;
    } else {
      acc.push(part);
    }
    return acc;
  }, []);
    let paragraphIndex = 0;

    return parts.map((text) => {
      const trimmed = text.trim();
      const isHeading = /^#{1,6}\s/.test(trimmed);
      const item = {
        text: trimmed,
        isHeading,
        index: isHeading ? null : paragraphIndex,
      };
      if (!isHeading) paragraphIndex++; // hanya increment kalau bukan heading
      return item;
    });
  }, [content]);

  return (
    <div className="prose prose-invert max-w-none text-neutral-200 prose-headings:text-white prose-p:leading-relaxed prose-p:indent-8 space-y-3">
      {elements.map(({ text, isHeading, index }) => (
        <ParagrafItemReadOnly
          key={`${babId}-${index ?? text.slice(0, 10)}`}
          text={text}
          isHeading={isHeading}
          index={index}
          babId={babId}
        />
      ))}
    </div>
  );
}
