// utils/markdownToPdf.js
import { Text, View } from "@react-pdf/renderer";
import { marked } from "marked";

export function renderMarkdownToPdf(markdown, styles) {
  const tokens = marked.lexer(markdown || "");

  return tokens.map((token, idx) => {
    switch (token.type) {
      case "heading":
        return (
          <Text
            key={idx}
            style={token.depth === 1 ? styles.heading1 : styles.heading2}
          >
            {token.text}
          </Text>
        );
      case "paragraph":
        return (
          <Text key={idx} style={styles.paragraph}>
            {token.text}
          </Text>
        );
      case "list":
        return (
          <View key={idx} style={{ marginBottom: 10 }}>
            {token.items.map((item, i) => (
              <Text key={i} style={styles.paragraph}>
                • {item.text}
              </Text>
            ))}
          </View>
        );
      case "code":
        return (
          <Text key={idx} style={[styles.paragraph, { fontFamily: "Courier" }]}>
            {token.text}
          </Text>
        );
      default:
        return null;
    }
  });
}
