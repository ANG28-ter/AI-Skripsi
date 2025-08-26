// routes/paraphrase.js
router.post("/paraphrase", async (req, res) => {
  const { teks } = req.body;

  if (!teks || teks.trim().length < 30) {
    return res.status(400).json({ error: "Teks terlalu pendek untuk diparafrase." });
  }

  const prompt = buildParaphrasePrompt(teks);

  try {
    const result = await gptCall({
      prompt,
      title: "paraphrase-akademik",
      system: "Kamu adalah AI akademik.",
      temperature: 0.5,
    });

    return res.json({ paraphrased: result });
  } catch (err) {
    console.error("❌ Gagal memproses parafrase:", err);
    return res.status(500).json({ error: "Gagal memproses parafrase." });
  }
});
