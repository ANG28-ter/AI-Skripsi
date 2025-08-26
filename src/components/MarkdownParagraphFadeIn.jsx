// src/components/MarkdownParagraphFadeIn.jsx
import React, { useMemo } from "react";
import ParagrafItem from "./ParagrafItem";
import { fixSpacing } from "/src/utils/fixSpacing";
import LoadingParagraphs from "./LoadingParagraphs";

export default function MarkdownParagraphFadeIn({
  content,
  isLoading = false,
  babId,
}) {
  const elements = useMemo(() => {
    const parts = fixSpacing(content)
  .split(/\n{2,}/g)
  .reduce((acc, part) => {
    const trimmed = part.trim();
    const last = acc[acc.length - 1] || "";

    // Gabungkan jika dua blok berturut-turut mengandung tanda tabel Markdown
    if (trimmed.includes("|") && last.includes("|")) {
      acc[acc.length - 1] = `${last}\n\n${trimmed}`;
    } else {
      acc.push(trimmed);
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

   const plainParas = useMemo(
    () => elements.filter((e) => !e.isHeading).map((e) => e.text),
    [elements]
  );

   // === NEW: derive judul BAB & sub-bab dari babId
  const { babTitle, subBabTitle } = useMemo(() => {
    // contoh babId: "bab3_3.2_lokasi_dan_waktu_penelitian"
    const m = (babId || "").match(/^bab(\d+)/);
    const babNum = m ? m[1] : "1";
    const babMap = {
      "1": "BAB I - Pendahuluan",
      "2": "BAB II - Tinjauan Pustaka",
      "3": "BAB III - Metodologi Penelitian",
      "4": "BAB IV - Hasil dan Pembahasan",
      "5": "BAB V - Penutup",
    };
    const title = babMap[babNum] || `BAB ${babNum}`;
    const sub = (babId || "").split("_").slice(1).join(" ").replace(/_/g, " ");
    return { babTitle: title, subBabTitle: sub };
  }, [babId]);

  if (isLoading) return <LoadingParagraphs />;

  return (
    <div className="prose prose-invert max-w-none text-neutral-200 prose-headings:text-white prose-p:leading-relaxed prose-p:indent-8 space-y-3">
      {elements.map(({ text, isHeading, index }) => {
        const prevText = index != null && index > 0 ? plainParas[index - 1] : "";
        const nextText = index != null && index < plainParas.length - 1 ? plainParas[index + 1] : "";
        return (
          <ParagrafItem
            key={`${babId}-${index}-${text.slice(0, 10)}`}
            text={text}
            isHeading={isHeading}
            index={index}
            babId={babId}
            // === NEW context ===
            prevText={prevText}
            nextText={nextText}
            babTitle={babTitle}
            subBabTitle={subBabTitle}
          />
        );
      })}
    </div>
  );
}
