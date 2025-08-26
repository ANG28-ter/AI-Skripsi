const fetch = require("node-fetch");
const { buildProofreadPrompt } = require("../lib/prompts/skripsiPrompt.js");

const proofreadController = async (req, res) => {
  const { input } = req.body;

  if (!input || input.trim().length < 5) {
    return res
      .status(400)
      .json({ output: "Teks terlalu pendek untuk diperiksa." });
  }

  try {
    const prompt = buildProofreadPrompt(input);

    const response = await fetch(
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
          max_tokens: 1000,
          messages: [
            { role: "system", content: "Kamu adalah AI editor akademik." },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    const data = await response.json();
    const output =
      data.choices?.[0]?.message?.content?.trim() || "Tidak ada hasil.";
    res.json({ output });
  } catch (err) {
    console.error("❌ Gagal proofreading:", err);
    res
      .status(500)
      .json({ output: "Terjadi kesalahan pada server proofreading." });
  }
};

module.exports = proofreadController;
