const axios = require("axios");

const fetchScholarPapers = async (query) => {
  const serpApiKey = process.env.SERPAPI_API_KEY;
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google_scholar&hl=id&api_key=${serpApiKey}`;

  try {
    const res = await axios.get(url);
    const items = res.data.organic_results || [];

    return items.map((item) => {
      const title = item.title || "Judul tidak tersedia";

      // 1️⃣ Ambil penulis
      let author = "Anonim";
      if (item.publication_info?.authors?.length) {
        author = item.publication_info.authors.map(a => a.name).join(", ");
      } else if (item.publication_info?.summary) {
        // Fallback: ambil teks sebelum tahun atau koma
        const matchAuthor = item.publication_info.summary.split(/[,|;|-]/)[0];
        if (matchAuthor && !matchAuthor.match(/\b(19|20)\d{2}\b/)) {
          author = matchAuthor.trim();
        }
      }

      // 2️⃣ Ambil tahun
      let year = "Tanpa Tahun";
      if (item.publication_info?.year) {
        year = item.publication_info.year;
      } else if (item.publication_info?.summary) {
        const matchYear = item.publication_info.summary.match(/\b(19|20)\d{2}\b/);
        if (matchYear) year = matchYear[0];
      }

      const summary = item.publication_info?.summary || `${author} - ${year}`;
      const snippet = item.snippet || "Tidak ada ringkasan.";

      return {
        author,
        year,
        title,
        summary,
        snippet,
      };
    });
  } catch (err) {
    console.error("❌ SerpAPI fetchScholarPapers() error:", err.message);
    return [];
  }
};

module.exports = fetchScholarPapers;
