export const fixSpacing = (text) => {
  return text
    .split("\n")
    .map((line) => {
      if (line.includes("|")) return line;
      return line.replace(/([a-z])\n(?=[A-Z])/g, "$1\n\n");
    })
    .join("\n");
};
