// src/export/SectionSmartPDF.jsx
import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

// STYLE
const styles = StyleSheet.create({
  heading: { fontSize: 13, fontWeight: "bold", marginTop: 14, marginBottom: 6 },
  paragraph: { marginBottom: 6, textAlign: "justify", fontSize: 11, lineHeight: 1.6 },
  table: {
    display: "table",
    width: "auto",
    marginBottom: 10,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#666",
  },
  row: { flexDirection: "row" },
  cell: {
    flex: 1,
    padding: 6,
    fontSize: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#666",
  },
  headerCell: {
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
  },
});

// SANITIZE TEKS
const sanitize = (text) =>
  text
    .replace(/^#{1,6}\s?/gm, "") // remove heading markers
    .replace(/[*_~`>]+/g, "") // remove markdown
    .replace(/^\s*-\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/---+/g, "")
    .trim();

// EKSTRAK BLOK (tabel dan paragraf)
const extractBlocks = (text) => {
  const lines = text.split("\n");
  const blocks = [];
  let currentParagraph = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (/^\|.+\|$/.test(line)) {
      if (currentParagraph.length > 0) {
        blocks.push({ type: "paragraph", content: currentParagraph.join(" ") });
        currentParagraph = [];
      }

      const tableLines = [line];
      i++;
      while (i < lines.length && /^\|.+\|$/.test(lines[i])) {
        tableLines.push(lines[i].trim());
        i++;
      }
      i--; // kembali satu langkah
      blocks.push({ type: "table", content: tableLines });
    } else {
      if (line !== "") currentParagraph.push(line);
      else if (currentParagraph.length > 0) {
        blocks.push({ type: "paragraph", content: currentParagraph.join(" ") });
        currentParagraph = [];
      }
    }
  }

  if (currentParagraph.length > 0) {
    blocks.push({ type: "paragraph", content: currentParagraph.join(" ") });
  }

  return blocks;
};

// RENDER BLOK
export default function SectionSmartPDF({ title, content }) {
  if (!content || content.trim() === "") return null;

  const blocks = extractBlocks(content);

  return (
    <View wrap>
      <Text style={styles.heading}>{title}</Text>

      {blocks.map((block, idx) => {
        if (block.type === "paragraph") {
          return (
            <Text key={idx} style={styles.paragraph}>
              {sanitize(block.content)}
            </Text>
          );
        }

        if (block.type === "table") {
          const rows = block.content;
          if (rows.length < 2) return null;

          const headers = rows[0].split("|").slice(1, -1).map(sanitize);
          const dataRows = rows.slice(2).map((line) =>
            line.split("|").slice(1, -1).map(sanitize)
          );

          return (
            <View key={idx} style={styles.table}>
              <View style={styles.row}>
                {headers.map((cell, i) => (
                  <Text key={i} style={[styles.cell, styles.headerCell]}>
                    {cell}
                  </Text>
                ))}
              </View>
              {dataRows.map((row, i) => (
                <View key={i} style={styles.row}>
                  {row.map((cell, j) => (
                    <Text key={j} style={styles.cell}>
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          );
        }

        return null;
      })}
    </View>
  );
}
