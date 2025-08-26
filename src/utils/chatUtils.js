// src/utils/chatUtils.js

// Bersihkan format markdown -> text polos
export const cleanMarkdown = (text) =>
  (text || "")
    .replace(/^(\*|-|#|>)+\s?/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/#+\s?/g, "")
    .trim();

// Perbaiki spasi antar paragraf
export const fixSpacing = (text) =>
  (text || "").replace(/([a-z])\n(?=[A-Z])/g, "$1\n\n");

// Ambil ekstensi file
export const getFileExtension = (filename) => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};
