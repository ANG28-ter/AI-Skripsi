const express = require("express");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();

const router = express.Router();

router.post("/contoh-penulisan", async (req, res) => {
  const { aiOutput } = req.body;

  if (!aiOutput || typeof aiOutput !== "string") {
    return res.status(400).json({ error: "aiOutput kosong atau tidak valid" });
  }

  try {
    const prompt = `
Berikut ini adalah hasil penulisan dari AI:
"""
${aiOutput}
"""

Tugasmu:
- Berikan contoh penulisan ideal berdasarkan hasil di atas
- Fokus pada ringkasan inti dari isi tersebut
- Buat ulang sebagai contoh penulisan ideal, singkat, padat, dan akademik
- Hindari pengulangan kalimat
- Jawaban hanya berupa paragraf contoh yang ringkas, tanpa tambahan catatan atau heading.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Contoh Penulisan Otomatis"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: "Kamu adalah AI akademik yang ahli membuat contoh penulisan skripsi."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    const contoh = data.choices?.[0]?.message?.content?.trim();

    res.json({ contoh });
  } catch (err) {
    console.error("❌ Gagal hasilkan contoh penulisan:", err);
    res.status(500).json({ error: "Gagal mengambil contoh dari AI." });
  }
});

module.exports = router;
