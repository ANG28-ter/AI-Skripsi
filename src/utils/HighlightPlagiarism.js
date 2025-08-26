// src/utils/highlightPlagiarism.js
export const commonPhrases = [
  "penelitian ini",
  "bertujuan untuk",
  "dengan demikian",
  "dapat disimpulkan",
  "dalam konteks",
  "berdasarkan teori",
  "menurut",
  "merupakan",
  "adalah",
];

export function highlightPlagiarism(text) {
  let highlighted = text;

  commonPhrases.forEach((phrase) => {
    const regex = new RegExp(`\\b(${phrase})\\b`, "gi");
    highlighted = highlighted.replace(
      regex,
      `<mark style="background-color: rgba(255, 0, 0, 0.4); border-radius: 3px; padding: 0 2px;">$1</mark>`
    );
  });

  return highlighted;
}
