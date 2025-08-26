const fetch = require("node-fetch");
const { buildParaphrasePrompt } = require("../lib/prompts/skripsiPrompt.js");

const paraphraseController = async (req, res) => {
  const { input } = req.body;

  if (!input || input.trim().length < 5) {
    return res
      .status(400)
      .json({ output: "Teks terlalu pendek untuk diparafrase." });
  }

  try {
    const prompt = buildParaphrasePrompt(input);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini", // atau gpt-4o-mini kalau butuh upgrade
          temperature: 0.5,
          max_tokens: 6000,
          messages: [
            {
              role: "system",
              content:
                "Kamu adalah AI akademik yang ahli dalam parafrase ilmiah.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    const data = await response.json();
    const output =
      data.choices?.[0]?.message?.content?.trim() ||
      "Tidak ada hasil parafrase.";
    res.json({ output });
  } catch (err) {
    console.error("❌ Gagal paraphrase:", err);
    res.status(500).json({ output: "Terjadi kesalahan saat memparafrase." });
  }
};

module.exports = paraphraseController;
