export function checkPlagiarismDummy(text) {
  const patterns = [
    "penelitian ini",
    "bertujuan untuk",
    "dalam konteks",
    "dengan demikian",
    "dapat disimpulkan",
    "menurut",
    "adalah",
  ];

  let totalLength = text.length;
  let copiedLength = 0;

  const highlighted = text;

  patterns.forEach((pattern) => {
    const regex = new RegExp(pattern, "gi");
    const matches = [...text.matchAll(regex)];

    copiedLength += matches.reduce((acc, match) => acc + match[0].length, 0);
  });

  const score = Math.max(0, 100 - Math.round((copiedLength / totalLength) * 100));

  return {
    score,
    message: score > 80 ? "Teks relatif unik" : "Teks memiliki banyak kesamaan umum",
  };
}
