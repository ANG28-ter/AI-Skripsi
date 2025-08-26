// 📁 server/struktur-evaluasi.js
const express = require("express");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();

const router = express.Router();

// POST /struktur-evaluasi
router.post("/struktur-evaluasi", async (req, res) => {
  const { aiText } = req.body;

  if (!aiText || typeof aiText !== "string") {
    return res.status(400).json({ error: "aiText tidak boleh kosong" });
  }

  try {
    const prompt = `
Berikut ini adalah hasil penulisan bagian skripsi:
"""
${aiText}
"""

Tugasmu:
1. Identifikasi setiap paragraf.
2. Jelaskan fungsi akademik dari setiap paragraf secara ringkas.
3. Format output sebagai array seperti ini:
[
  "Paragraf 1: Fungsi paragraf 1",
  "Paragraf 2: Fungsi paragraf 2",
  ...
]

Hanya kembalikan array saja tanpa tambahan teks.`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Struktur Evaluasi AI Skripsi"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: "Kamu adalah AI akademik yang ahli dalam mengevaluasi struktur penulisan skripsi."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const match = raw.match(/\[.*\]/s);
    const output = match ? JSON.parse(match[0]) : ["Gagal memproses struktur."];

    res.json({ output });
  } catch (err) {
    console.error("❌ Struktur Evaluasi Error:", err);
    res.status(500).json({ error: "Gagal menghasilkan evaluasi struktur." });
  }
});

module.exports = router;
