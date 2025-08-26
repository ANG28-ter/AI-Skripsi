const express = require("express");
const router = express.Router();
const { tanyaAiHandler } = require("../services/gptService");

router.post("/", async (req, res) => {
  const { bab, pertanyaan } = req.body;

  if (!bab || !pertanyaan) {
    return res.status(400).json({ error: "BAB dan pertanyaan wajib diisi." });
  }

  try {
    const jawaban = await tanyaAiHandler(bab, pertanyaan);
    res.json({ jawaban });
  } catch (err) {
    console.error("❌ Error /tanya-ai:", err);
    res.status(500).json({ error: "Gagal menjawab pertanyaan AI." });
  }
});

module.exports = router;
