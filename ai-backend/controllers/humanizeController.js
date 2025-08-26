app.post("/humanize-output", async (req, res) => {
  const { input } = req.body;

  if (!input || input.trim().length < 10) {
    return res.status(400).json({ output: "Input terlalu pendek" });
  }

  const prompt = `
Tugas kamu adalah menulis ulang teks akademik berikut agar terdengar alami seperti ditulis oleh mahasiswa Indonesia, namun tetap menggunakan **bahasa Indonesia formal dan baku**.

- Jangan gunakan kata gaul, tidak baku, atau singkatan informal.
- Hindari gaya bahasa terlalu sempurna seperti AI atau textbook.
- Gunakan struktur kalimat yang mengalir, tapi tetap memenuhi kaidah penulisan akademik.
- Boleh tambahkan kalimat transisi ringan seperti: “oleh karena itu”, “dengan demikian”, “hal ini menunjukkan bahwa”.
- Tulis dalam paragraf panjang, tidak perlu beri salam pembuka atau format markdown.

Teks asli:
${input}

Versi yang sudah diperhalus secara akademik:
`;

  try {
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
          temperature: 0.95,
          max_tokens: 1500,
          messages: [
            {
              role: "system",
              content:
                "Kamu adalah AI akademik untuk editing skripsi mahasiswa.",
            },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content?.trim() || "";
    res.json({ output });
  } catch (err) {
    console.error("❌ Gagal humanize:", err);
    res
      .status(500)
      .json({ output: "Gagal memproses teks menjadi lebih manusiawi." });
  }
});