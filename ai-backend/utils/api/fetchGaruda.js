const fetch = require("node-fetch");

const fetchGaruda = async (query) => {
  const apiKey = process.env.SERPAPI_API_KEY;
  const url = `https://serpapi.com/search.json?engine=google&q=site:garuda.kemdikbud.go.id ${encodeURIComponent(query)}&api_key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.organic_results) return [];

  return data.organic_results.map((item) => ({
    title: item.title,
    snippet: item.snippet,
    link: item.link,
  }));
};

module.exports = fetchGaruda;
