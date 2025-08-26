const fetch = require("node-fetch");

async function generateTitleFromMessages(req, res) {
  const { messages } = req.body;

  if (!messages || !messages.length) {
    return res.status(400).json({ error: "Tidak ada pesan untuk dijadikan title." });
  }

  try {
    // Ambil 1-2 pesan awal buat bahan
    const firstMessages = messages
      .slice(0, 2)
      .map(m => m.content)
      .join("\n\n");

    const prompt = `
      Berdasarkan percakapan berikut, buat judul singkat, profesional,
      maksimal 5 kata, tanpa tanda kutip.
      
      Percakapan:
      ${firstMessages}
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // bisa ganti model sesuai preferensi lo
        messages: [{ role: "user", content: prompt }],
        max_tokens: 20,
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("Tidak ada respon dari model.");
    }

    const title = data.choices[0].message.content.trim();

    return res.json({ title });
  } catch (err) {
    console.error("Error generate title:", err);
    res.status(500).json({ error: "Gagal membuat title." });
  }
}

module.exports = {
  generateTitleFromMessages,
};
