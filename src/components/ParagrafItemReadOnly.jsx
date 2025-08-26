import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ParagrafItemReadOnly({ text, index, isHeading, babId }) {
  const [display, setDisplay] = useState(text);

  const loadFromStore = () => {
    if (isHeading || index == null) return setDisplay(text);
    const stored = JSON.parse(localStorage.getItem("skripsi_paraphrases") || "{}");
    const key = `paragraf_${babId}_${index}`;
    const saved = stored[key];
    setDisplay(saved || text);
  };

  useEffect(() => {
    loadFromStore();
  }, [text, index, isHeading, babId]);

  useEffect(() => {
    const onUpdate = () => loadFromStore();
    window.addEventListener("paraphrase_updated", onUpdate);
    return () => window.removeEventListener("paraphrase_updated", onUpdate);
  }, [text, index, isHeading, babId]);

  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{display}</ReactMarkdown>;
}
