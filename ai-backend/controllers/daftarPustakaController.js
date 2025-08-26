const fetch = require("node-fetch");
const {
  buildKeywordExtractionPrompt,
} = require("../lib/prompts/skripsiPrompt");
require("dotenv").config();

const daftarPustakaController = async (req, res) => {
  const { bab1, bab2, bab3, bab4 } = req.body;

  if (!bab1 || !bab2 || !bab3 || !bab4) {
    return res.status(400).json({ error: "Bab 1–4 harus terisi semua" });
  }

  const serpApiKey = process.env.SERPAPI_API_KEY;
  const fullText = `${bab1}\n\n${bab2}\n\n${bab3}\n\n${bab4}`;
  const prompt = buildKeywordExtractionPrompt(fullText);

  let keywords = [];
  const references = [];

  // Step 1: Ekstraksi keyword (maks 5)
  try {
    const keywordRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          temperature: 0.4,
          messages: [
            { role: "system", content: "Kamu adalah AI akademik." },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    const keywordData = await keywordRes.json();
    const raw = keywordData.choices?.[0]?.message?.content || "";
    keywords = raw
      .split("\n")
      .map((k) => k.replace(/^[-•*]?\s?/, "").trim())
      .filter(Boolean)
      .slice(0, 10);
  } catch (err) {
    console.error("❌ Gagal ekstrak keyword:", err);
    return res.status(500).json({ error: "Gagal ekstrak kata kunci." });
  }

  // Step 2: Ambil 1 hasil saja per keyword
  for (const keyword of keywords) {
    try {
      const url = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(
        keyword
      )}&api_key=${serpApiKey}`;
      const response = await fetch(url);
      const result = await response.json();

      const top1 = result.organic_results?.[0];
      if (top1) {
        references.push({
          keyword,
          title: top1.title || "Tanpa Judul",
          author: top1.publication_info?.summary || "",
          snippet: top1.snippet || "",
          link: top1.link || "#",
        });
      }
    } catch (err) {
      console.warn(`❌ Gagal ambil referensi untuk: ${keyword}`);
    }
  }

  return res.json({ keywords, daftarPustaka: references });
};

module.exports = daftarPustakaController;
