const fetch = require("node-fetch");
const dotenv = require("dotenv");
const gptCall = require("../utils/gptCall");
dotenv.config();

const {
  generatePrompt,
  generateAbstrakPrompt,
  latarBelakangSubPrompts,
  buildLatarBelakangPrompt,
  buildRumusanMasalahPrompt,
  buildTujuanPenelitianPrompt,
  buildManfaatPenelitianPrompt,
  buildRuangLingkupPrompt,
  kajianTeoriSubPrompts,
  buildKajianTeoriPrompt,
  buildKerangkaPemikiranPrompt,
  buildHipotesisPrompt,
  buildJenisPendekatanPrompt,
  buildLokasiWaktuPrompt,
  buildPopulasiSampelPrompt,
  buildTeknikPengumpulanDataPrompt,
  buildInstrumenPenelitianPrompt,
  buildUjiValiditasReliabilitasPrompt,
  buildTeknikAnalisisDataPrompt,
  buildProsedurPenelitianPrompt,
  buildJadwalPenelitianPrompt,
  buildGambaranUmumObjekPrompt,
  buildPenyajianDataPrompt,
  buildAnalisisKuantitatifPrompt,
  buildAnalisisKualitatifPrompt,
  buildPromptFromData,
  buildPembahasanSubPrompt,
  buildParaphrasePrompt,
  buildBab5Prompt,
  headingsGambaranUmum,
  headingsPenyajianData,
  headingsAnalisisKuantitatif,
  headingsAnalisisKualitatif,
  buildBasePrompt,
} = require("../lib/prompts/skripsiPrompt");

const isSimilar = (a, b) => {
  const norm = (str) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(" ")
      .slice(0, 5)
      .join(" ");
  return norm(a) === norm(b);
};

async function generateByHeadings(
  headings,
  basePrompt,
  minWordsPerHeading = 800
) {
  let fullText = "";
  for (const heading of headings) {
    const prompt = `${basePrompt}\n\nTulis bagian "${heading}" secara mendalam minimal ${minWordsPerHeading} kata. Jika data numerik, tambahkan tabel, perhitungan, analisis statistik, dan interpretasi. Jika tidak ada data, buat contoh akademik yang relevan.`;

    const response = await gptCall({
      prompt,
      title: heading,
      system:
        "Kamu adalah AI akademik yang menulis skripsi dengan detail tinggi.",
      model: "openai/gpt-4o-mini",
      max_tokens: 6000,
      temperature: 0.6,
    });

    fullText += `\n\n${heading}\n${response}`;
    console.log(`✅ Selesai generate: ${heading}`);
  }
  return fullText;
}

async function generateLongContent(prompt, minWords = 2000, maxIter = 5) {
  let fullText = "";
  let iteration = 0;

  while (fullText.split(" ").length < minWords && iteration < maxIter) {
    iteration++;

    const continuationInstruction = fullText
      ? `Teks sejauh ini:\n"""\n${fullText.slice(
          -3000
        )}\n"""\n\nSekarang lanjutkan dengan menulis detail tambahan untuk bagian yang belum lengkap, tambahkan analisis mendalam, perhitungan, contoh, dan interpretasi. Jangan ulang bagian sebelumnya. Pastikan total panjang mencapai minimal ${minWords} kata. Tulis minimal 800 kata dalam bagian ini.`
      : `${prompt}\n\nMulai bagian pertama (target minimal 1000 kata).`;

    const response = await gptCall({
      prompt: continuationInstruction,
      title: `bab4-iterasi-${iteration}`,
      system:
        "Kamu adalah AI akademik yang menulis skripsi dengan detail tinggi.",
      model: "openai/gpt-4o-mini",
      max_tokens: 6000,
      temperature: 0.6,
    });

    fullText += "\n\n" + response;
    console.log(`✅ Iterasi ${iteration}: ${fullText.split(" ").length} kata`);
  }

  return fullText;
}

const fetchScholarPapers = require("../utils/serpApiScholar");
const generatedTitles = new Set();

const shouldUseTable = (data) => {
  // Cek jika data punya kolom dan lebih dari 1 baris
  if (!Array.isArray(data)) return false;
  if (data.length < 2) return false;

  const sampleRow = data[0];
  if (!sampleRow || typeof sampleRow !== "object") return false;

  // Cek apakah ada nilai numerik di salah satu kolom
  return Object.values(sampleRow).some((val) => {
    return typeof val === "number" || (!isNaN(val) && val !== "");
  });
};

const generateController = async (req, res) => {
  const { bab, topik, jurusan, tipePenelitian, data, bagian } = req.body;
  if (!topik || !jurusan || !bab) {
    return res
      .status(400)
      .json({ error: "Topik, jurusan, dan bab wajib diisi." });
  }

  try {
    if (bab === "skripsi-full") {
      const results = [];

      // 1️⃣ Ambil referensi asli dari Google Scholar
      let realReferences = [];
      try {
        const searchQuery = `${topik} ${jurusan}`;
        realReferences = await fetchScholarPapers(searchQuery);
      } catch (err) {
        console.error("❌ Gagal mengambil referensi dari Google Scholar:", err);
      }

      // Format jadi daftar pustaka (maksimal 5)
      const formattedRefs = realReferences.slice(0, 5).map((paper) => {
        const title = paper.title || "Judul tidak tersedia";
        const author = paper.author || "Anonim";
        const year = paper.year || "Tanpa Tahun";
        return `${author} (${year}) "${title}"`;
      });

      // 2️⃣ Loop maksimal 10 kali, ambil maksimal 7 hasil unik
      for (let i = 0; i < 10 && results.length < 7; i++) {
        const promptMain = generatePrompt({
          topik,
          jurusan,
          references: formattedRefs,
          loopIndex: i, // kirim index loop supaya GPT memvariasikan hasil
        });

        const rawMain = await gptCall({
          prompt: promptMain.trim(),
          title: "AI Skripsi Generator",
          system:
            "Kamu adalah AI pembantu mahasiswa. Jawaban harus berupa JSON valid.",
          max_tokens: 4000,
          temperature: 0.85, // sedikit dinaikkan agar variasi lebih banyak
        });

        try {
          const fallbackMain = rawMain.match(/{[\s\S]*}/);
          const jsonMain = JSON.parse(fallbackMain?.[0] || "{}");
          const title = jsonMain?.judul?.toLowerCase()?.trim();

          // Skip kalau judul kosong atau duplikat
          if (!title || [...generatedTitles].some((t) => isSimilar(t, title))) {
            continue;
          }

          // 3️⃣ Generate abstrak terpisah
          const promptAbstrak = generateAbstrakPrompt({
            judul: jsonMain.judul,
            topik,
            jurusan,
          });

          const abstrakText = await gptCall({
            prompt: promptAbstrak,
            title: "AI Abstrak Skripsi",
            system:
              "Kamu adalah AI akademik. Jawaban harus berupa teks abstrak panjang sesuai instruksi.",
            max_tokens: 4000,
            temperature: 0.7,
          });

          // 4️⃣ Gabungkan ke results
          generatedTitles.add(title);
          results.push({
            ...jsonMain,
            abstrak: abstrakText.trim(),
          });
        } catch (err) {
          console.error("❌ Gagal parsing hasil AI:", err);
          results.push({
            judul: "Gagal parsing hasil AI",
            rumusan: rawMain,
            abstrak: "Tidak tersedia",
            referensi: formattedRefs,
          });
        }
      }

      return res.json({ results });
    }

    // Bab 1

    if (bab === "latar-belakang") {
      const parts = [];
      for (const instruksi of latarBelakangSubPrompts) {
        const prompt = buildLatarBelakangPrompt({ topik, jurusan, instruksi });
        const text = await gptCall({
          prompt,
          title: "latar-belakang",
          system: "Kamu adalah AI akademik.",
        });
        parts.push(text);
      }
      return res.json({ latarBelakang: parts.join("\n\n") });
    }

    if (bab === "rumusan-masalah") {
      const prompt = buildRumusanMasalahPrompt({ topik, jurusan });
      const raw = await gptCall({
        prompt,
        title: "skripsi-rumusan",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ rumusanMasalah: raw });
    }

    if (bab === "tujuan-penelitian") {
      const prompt = buildTujuanPenelitianPrompt({ topik, jurusan });
      const raw = await gptCall({
        prompt,
        title: "skripsi-tujuan",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ tujuanPenelitian: raw });
    }

    if (bab === "manfaat-penelitian") {
      const prompt = buildManfaatPenelitianPrompt({ topik, jurusan });
      const raw = await gptCall({
        prompt,
        title: "skripsi-manfaat",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ manfaatPenelitian: raw });
    }

    if (bab === "ruang-lingkup") {
      const prompt = buildRuangLingkupPrompt({ topik, jurusan });
      const raw = await gptCall({
        prompt,
        title: "skripsi-ruanglingkup",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ ruangLingkup: raw });
    }

    // Bab 2
    const generatePenelitianTerdahulu = async (topik, jurusan) => {
      const searchQuery = `Penelitian terdahulu terkait ${topik} ${jurusan}`;
      let papers = await fetchScholarPapers(searchQuery);
      if (!papers.length) return "Tidak ditemukan artikel jurnal relevan.";

      papers = papers.slice(0, 10); // maksimal 10 jurnal
      const batchSize = 5;
      const batches = [];

      for (let i = 0; i < papers.length; i += batchSize) {
        const batch = papers.slice(i, i + batchSize);
        const formatted = batch
          .map((paper, i) => {
            const title = paper.title || "Judul tidak tersedia";
            const summary =
              paper.summary ||
              `${paper.author || "Anonim"} - ${paper.year || "Tanpa Tahun"}`;
            return `${i + 1}. ${title}\n   ${summary}`;
          })
          .join("\n\n");

        const prompt = `
Tulis ringkasan ilmiah dari jurnal-jurnal berikut dengan FORMAT WAJIB:
1. Nama Penulis (Tahun) "Judul"
   Ringkasan naratif (3–5 kalimat) yang memuat:
   - Metode & tujuan penelitian
   - Hasil utama
   - Relevansi terhadap topik "${topik}"
   - Kelemahan atau keterbatasan penelitian

Ketentuan:
- Gunakan bahasa akademik naratif (tidak bullet point).
- Jangan ubah format penomoran atau tanda kutip pada judul.
- Jika penulis lebih dari satu, tulis penulis pertama diikuti "dkk."
- Jika tahun tidak ada, tulis "(Tanpa Tahun)".

Daftar jurnal:
${formatted}
`.trim();

        batches.push(
          gptCall({
            prompt,
            title: `penelitian-terdahulu`,
            system:
              "Kamu adalah AI akademik. Tulis ringkasan paragraf naratif untuk setiap jurnal.",
            model: "openai/gpt-4o",
            max_tokens: 4000,
            babKey: "penelitianTerdahulu",
          })
        );
      }

      const summaries = await Promise.all(batches);
      return summaries.join("\n\n");
    };

    if (bab === "kajian-teori") {
      const parts = [];

      for (const instruksi of kajianTeoriSubPrompts) {
        const prompt = buildKajianTeoriPrompt({ topik, jurusan, instruksi });

        const resPart = await gptCall({
          prompt,
          title: `kajian-teori-${instruksi}`,
          system: "Kamu adalah AI akademik. Tulis narasi ilmiah untuk skripsi.",
          babKey: "bab2",
        });

        parts.push(resPart);
      }

      return res.json({ kajianTeori: parts.join("\n\n") });
    }

    if (bab === "penelitian-terdahulu") {
      const hasil = await generatePenelitianTerdahulu(topik, jurusan);
      return res.json({ penelitianTerdahulu: hasil });
    }

    if (bab === "kerangka-pemikiran") {
      const prompt = buildKerangkaPemikiranPrompt({ topik, jurusan });
      const response = await gptCall({
        prompt,
        title: "kerangka-pemikiran",
        system: "Kamu adalah AI akademik.",
        model: "openai/gpt-4o-mini",
      });
      return res.json({ kerangkaPemikiran: response });
    }

    if (bab === "hipotesis") {
      const prompt = buildHipotesisPrompt({ topik, jurusan });
      const response = await gptCall({
        prompt,
        title: "hipotesis",
        system: "Kamu adalah AI akademik.",
        model: "openai/gpt-4o-mini",
      });
      return res.json({ hipotesis: response });
    }

    // Bab 3

    if (bab === "jenis-pendekatan") {
      const prompt = buildJenisPendekatanPrompt({ topik, jurusan });
      const result = await gptCall({
        prompt,
        title: "bab3-jenis",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ jenisPendekatan: result });
    }

    if (bab === "lokasi-waktu") {
      const prompt = buildLokasiWaktuPrompt({ topik, jurusan });
      const result = await gptCall({
        prompt,
        title: "bab3-lokasi",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ lokasiWaktu: result });
    }

    if (bab === "populasi-sampel") {
      const prompt = buildPopulasiSampelPrompt({ topik, jurusan });
      const result = await gptCall({
        prompt,
        title: "bab3-populasi",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ populasiSampel: result });
    }

    if (bab === "teknik-pengumpulan") {
      const prompt = buildTeknikPengumpulanDataPrompt({ topik, jurusan });
      const result = await gptCall({
        prompt,
        title: "bab3-pengumpulan",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ teknikPengumpulan: result }); // ✅ ganti key
    }

    if (bab === "instrumen-penelitian") {
      const prompt = buildInstrumenPenelitianPrompt({ topik, jurusan });
      const result = await gptCall({
        prompt,
        title: "bab3-instrumen",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ instrumen: result }); // ✅ ganti key
    }

    if (bab === "validitas-reliabilitas") {
      const prompt = buildUjiValiditasReliabilitasPrompt({ topik, jurusan });
      const result = await gptCall({
        prompt,
        title: "bab3-validitas",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ validitasReliabilitas: result }); // ✅ ganti key
    }

    if (bab === "analisis-data") {
      const prompt = buildTeknikAnalisisDataPrompt({ topik, jurusan });
      const result = await gptCall({
        prompt,
        title: "bab3-analisis",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ teknikAnalisis: result }); // ✅ ganti key
    }
    if (bab === "prosedur-penelitian") {
      const prompt = buildProsedurPenelitianPrompt({ topik, jurusan });
      const result = await gptCall({
        prompt,
        title: "bab3-prosedur",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ prosedurPenelitian: result });
    }

    if (bab === "jadwal-penelitian") {
      const prompt = buildJadwalPenelitianPrompt({ topik, jurusan });
      const result = await gptCall({
        prompt,
        title: "bab3-jadwal",
        system: "Kamu adalah AI akademik.",
      });
      return res.json({ jadwalPenelitian: result });
    }

    // Bab 4
    const safeValue = (val, fallback) =>
      val && val.trim() !== "" ? val : fallback;
    const safeTipePenelitian = safeValue(tipePenelitian, "");
    const safeData = safeValue(
      data,
      "Belum ada data eksplisit, buat contoh akademik relevan."
    );

    // ✅ Gambaran Umum (4.1)
    if (bab === "gambaran-umum") {
      const basePrompt = buildBasePrompt({
        topik,
        jurusan,
        tipePenelitian: safeTipePenelitian,
        data: safeData,
      });
      const result = await generateByHeadings(
        headingsGambaranUmum,
        basePrompt,
        700
      );
      return res.json({ gambaranUmum: result });
    }

    // ✅ Penyajian Data (4.2)
    if (bab === "penyajian-data") {
      const basePrompt = buildBasePrompt({
        topik,
        jurusan,
        tipePenelitian: safeTipePenelitian,
        data: safeData,
      });
      const result = await generateByHeadings(
        headingsPenyajianData,
        basePrompt,
        800
      );
      return res.json({ penyajianData: result });
    }

    // ✅ Analisis Data Kuantitatif (4.3.1)
    if (bab === "analisis-data-kuantitatif") {
      const basePrompt = buildBasePrompt({
        topik,
        jurusan,
        tipePenelitian: safeTipePenelitian,
        data: safeData,
      });
      const result = await generateByHeadings(
        headingsAnalisisKuantitatif,
        basePrompt,
        900
      );
      return res.json({ analisisDataKuantitatif: result });
    }

    // ✅ Analisis Data Kualitatif (4.3.2)
    if (bab === "analisis-data-kualitatif") {
      const basePrompt = buildBasePrompt({
        topik,
        jurusan,
        tipePenelitian: safeTipePenelitian,
        data: safeData,
      });
      const result = await generateByHeadings(
        headingsAnalisisKualitatif,
        basePrompt,
        900
      );
      return res.json({ analisisDataKualitatif: result });
    }

    // ✅ Pembahasan Sub (4.4.x)
    if (bab === "pembahasan-sub") {
      console.log("📌 MEMPROSES PEMBAHASAN-SUB", bagian);
      if (!bagian) {
        return res
          .status(400)
          .json({ error: "Bagian wajib diisi untuk pembahasan-sub." });
      }

      // 🔹 Jika bagian = "all", proses semua pembahasan 4.4.1–4.4.3 sekaligus
      if (bagian === "all") {
        const subBagianList = [
          "4.4.1 Hubungan Hasil Penelitian dengan Teori",
          "4.4.2 Pembahasan Temuan Unik atau Anomali",
          "4.4.3 Perbandingan dengan Penelitian Sebelumnya",
        ];

        const results = {};
        for (const sub of subBagianList) {
          const prompt = buildPembahasanSubPrompt({
            topik,
            jurusan,
            bagian: sub,
            tipePenelitian: safeTipePenelitian,
            data: safeData,
          });

          results[sub] = await gptCall({
            prompt,
            title: `bab4-${sub}-pembahasan`,
            system: "Kamu adalah AI akademik.",
          });
        }

        return res.json({
          pembahasan1: results[subBagianList[0]],
          pembahasan2: results[subBagianList[1]],
          pembahasan3: results[subBagianList[2]],
        });
      }

      // 🔹 Mode single bagian seperti biasa
      let prompt;
      if (bagian.startsWith("4.4")) {
        prompt = buildPembahasanSubPrompt({
          topik,
          jurusan,
          bagian,
          tipePenelitian: safeTipePenelitian,
          data: safeData,
        });
      } else if (bagian.includes("4.1")) {
        prompt = buildGambaranUmumObjekPrompt({
          topik,
          jurusan,
          data: safeData,
        });
      } else if (bagian.includes("4.2")) {
        prompt = buildPenyajianDataPrompt({ topik, jurusan, data: safeData });
      } else if (bagian.includes("4.3.1.1")) {
        prompt = buildAnalisisKuantitatifPrompt({
          topik,
          jurusan,
          data: safeData,
        });
      } else if (bagian.includes("4.3.1.2")) {
        prompt = buildAnalisisKualitatifPrompt({
          topik,
          jurusan,
          data: safeData,
        });
      } else {
        prompt = buildPromptFromData({
          topik,
          jurusan,
          tipePenelitian: safeTipePenelitian,
          data: safeData,
          bagian,
        });
      }

      const result = await gptCall({
        prompt,
        title: `bab4-${bagian}-pembahasan`,
        system: "Kamu adalah AI akademik.",
      });

      return res.json({ pembahasanSub: result });
    }

    // ✅ Analisis dari Data
    if (bab === "analisis-dari-data") {
      if (!bagian) {
        return res
          .status(400)
          .json({ error: "Bagian wajib diisi untuk analisis-dari-data." });
      }

      const basePrompt = buildBasePrompt({
        topik,
        jurusan,
        tipePenelitian: safeTipePenelitian,
        data: safeData,
      });

      let headings = [];
      if (bagian.startsWith("4.1")) {
        headings = headingsGambaranUmum;
      } else if (bagian.startsWith("4.2")) {
        headings = headingsPenyajianData;
      } else if (bagian.startsWith("4.3.1")) {
        headings = headingsAnalisisKuantitatif;
      } else if (bagian.startsWith("4.3.2")) {
        headings = headingsAnalisisKualitatif;
      } else {
        headings = [bagian];
      }

      const result = await generateByHeadings(headings, basePrompt, 800);

      if (bagian.startsWith("4.1"))
        return res.json({ gambaranUmum: result, output: result });
      if (bagian.startsWith("4.2"))
        return res.json({ penyajianData: result, output: result });
      if (bagian.startsWith("4.3.1"))
        return res.json({ analisisDataKuantitatif: result, output: result });
      if (bagian.startsWith("4.3.2"))
        return res.json({ analisisDataKualitatif: result, output: result });

      return res.json({ hasil: result, output: result });
    }
    // Bab 5

    if (bab === "bab5") {
      const prompt = buildBab5Prompt({ topik, jurusan });
      const raw = await gptCall({
        prompt,
        title: "skripsi-bab5",
        system: "Jawaban kamu harus berupa JSON valid tanpa pembuka.",
      });

      try {
        const parsed = JSON.parse(raw);
        return res.json({
          bab5_1: parsed.bab5_1 || "",
          bab5_2: parsed.bab5_2 || "",
          bab5_3: parsed.bab5_3 || "", // tambahkan ini jika prompt mendukung
          bab5_4: parsed.bab5_4 || "", // tambahkan ini juga
        });
      } catch {
        const match = raw.match(/{[\s\S]*}/);
        try {
          const parsed = JSON.parse(match?.[0] || "{}");
          return res.json({
            bab5_1: parsed.bab5_1 || "",
            bab5_2: parsed.bab5_2 || "",
            bab5_3: parsed.bab5_3 || "",
            bab5_4: parsed.bab5_4 || "",
          });
        } catch {
          return res
            .status(500)
            .json({ bab5_1: "", bab5_2: "", bab5_3: "", bab5_4: "" });
        }
      }
    }

    if (bab === "paraphrase") {
      const { teks } = req.body;

      if (!teks || teks.trim().length < 30) {
        return res
          .status(400)
          .json({ error: "Teks terlalu pendek untuk diparafrase." });
      }

      // Langsung buat prompt tanpa topik/jurusan
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
    }

    return res.status(400).json({ error: `BAB ${bab} belum tersedia.` });
  } catch (err) {
    console.error("❌ Gagal generate:", err);
    return res.status(500).json({ error: "Terjadi kesalahan internal." });
  }
};

module.exports = generateController;
