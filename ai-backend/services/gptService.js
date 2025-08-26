const fetch = require("node-fetch");

async function tanyaAiHandler(bab, pertanyaan) {
  if (!bab || !pertanyaan) {
    return "❌ BAB atau pertanyaan tidak boleh kosong.";
  }

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
          model: "openai/gpt-4o",
          temperature: 0.35, // Lebih stabil untuk jawaban akademik
          top_p: 0.9,
          max_tokens: 3500, // Jawaban panjang + detail
          messages: [
            {
              role: "system",
              content: `Kamu adalah AI asisten akademik yang ahli di bidang penulisan skripsi mahasiswa Indonesia. 
Gunakan bahasa formal, jelas, dan sesuai kaidah akademik.
Jangan menjawab di luar konteks skripsi yang diberikan.
Jika diminta menjelaskan teori, sertakan sumber umum atau referensi yang relevan.`,
            },
            {
              role: "user",
              content: `Berikut isi BAB skripsi yang perlu kamu rujuk:

""" 
${bab}
"""

Pertanyaan mahasiswa:
"${pertanyaan}"

Berikan jawaban yang:
1. Langsung menjawab pertanyaan dengan mengacu pada isi BAB.
2. Jika ada kekurangan pada BAB, berikan saran perbaikan.
3. Gunakan format poin atau paragraf singkat yang terstruktur.
4. Sertakan contoh atau referensi jika memungkinkan.`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const output =
      data.choices?.[0]?.message?.content?.trim() ||
      "⚠️ Jawaban tidak ditemukan.";

    // Format agar siap ditampilkan di markdown UI
    return `### Jawaban AI:\n${output}`;
  } catch (err) {
    console.error("❌ Error di tanyaAiHandler:", err);
    return "⚠️ Terjadi kesalahan saat memproses permintaan ke AI.";
  }
}

module.exports = { tanyaAiHandler };
