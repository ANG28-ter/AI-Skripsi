const fetch = require("node-fetch");
const { OPENROUTER_API_KEY } = process.env;

const babConfig = {
  // Bab 1
  "skripsi-full": {
    model: "openai/gpt-4o-mini",
    temperature: 0.95,
    max_tokens: 5000,
  },
  "latar-belakang": {
    model: "openai/gpt-4o-mini",
    temperature: 0.75,
    max_tokens: 6000,
  },
  "rumusan-masalah": {
    model: "openai/gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 2000,
  },
  "tujuan-penelitian": {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 5000,
  },
  "manfaat-penelitian": {
    model: "openai/gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 5000,
  },
  "ruang-lingkup": {
    model: "openai/gpt-4o",
    temperature: 0.7,
    max_tokens: 5000,
  },

  // Bab 2
  "kajian-teori": {
    model: "openai/gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 5000,
  },
  "penelitian-terdahulu": {
    model: "openai/gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 4500,
  },
  "kerangka-pemikiran": {
    model: "openai/gpt-4o-mini",
    temperature: 0.65,
    max_tokens: 5000,
  },
  hipotesis: {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 1500,
  },

  // Bab 3
  "jenis-penelitian": {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 5000,
  },
  "lokasi-penelitian": {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 4500,
  },
  "populasi-sampel": {
    model: "openai/gpt-4o-mini",
    temperature: 0.65,
    max_tokens: 5000,
  },
  "pengumpulan-data": {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 5000,
  },
  "instrumen-penelitian": {
    model: "openai/gpt-4o-mini",
    temperature: 0.65,
    max_tokens: 4800,
  },
  "validitas-reliabilitas": {
    model: "openai/gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 5000,
  },
  "analisis-data": {
    model: "openai/gpt-4o-mini",
    temperature: 0.75,
    max_tokens: 5200,
  },
  "prosedur-penelitian": {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 5000,
  },
  "jadwal-penelitian": {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 4000,
  },

  // Bab 4 & 5
  "gambaran-umum": {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 6000,
  },

    "penyajian-data": {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 6000,
  },

    "analisis-data-kuantitatif": {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 6000,
  },
  
    "analisis-data-kualitatif": {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 6000,
  },
  "pembahasan-sub": {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 6000,
  },

  "analisis-dari-data": {
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    max_tokens: 6000,
  },

  bab5: {
    model: "openai/gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 4000,
  },

  // Default fallback
  default: {
    model: "openai/gpt-4o-mini",
    temperature: 0.85,
    max_tokens: 3000,
  },
};

const gptCall = async ({
  prompt,
  title = "",
  system = "Kamu adalah AI akademik.",
  babKey = "default",
}) => {
  const config = babConfig[babKey] || babConfig.default;
  const { model, temperature, max_tokens } = config;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": title,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await response.json();

    if (!data || !data.choices || !data.choices[0]) {
      console.error("❌ GPT response invalid:", JSON.stringify(data, null, 2));
      return "❌ Gagal memproses respon dari AI.";
    }

    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ Error saat memanggil GPT:", err);
    return "❌ Terjadi kesalahan saat memanggil AI.";
  }
};

module.exports = gptCall;
