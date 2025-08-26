const fetch = require("node-fetch");

const evaluatorController = async (req, res) => {
  const { userText, aiText } = req.body;

  if (!userText || !aiText) {
    return res.status(400).json({ error: "Tulisan mahasiswa dan AI harus diisi." });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "skripsi-evaluator",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah AI akademik yang menilai tulisan mahasiswa Indonesia berdasarkan struktur, fokus, dan gaya bahasa skripsi. Berikan feedback ringkas dan edukatif.",
          },
          {
            role: "user",
            content: `Bandingkan dua teks berikut:

✍️ Tulisan Mahasiswa:
${userText}

🤖 Tulisan AI:
${aiText}

Berikan penilaian edukatif untuk tulisan mahasiswa. Komentari: apakah sudah cukup fokus, apakah sesuai struktur akademik, dan saran singkat untuk memperbaikinya. Jawaban tidak perlu lebih dari 5 kalimat. Jangan bahas isi tulisan AI.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || "Tidak ada tanggapan.";
    res.json({ feedback });
  } catch (error) {
    console.error("❌ Gagal evaluasi:", error);
    res.status(500).json({ error: "Gagal mengevaluasi tulisan mahasiswa." });
  }
};

module.exports = evaluatorController;
