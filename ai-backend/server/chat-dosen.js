// backend/routes/chat-dosen.js
// Refactor: tanpa persona, tetap injeksi subbab, natural seperti ChatGPT

require("dotenv").config();

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Prefer native fetch (Node 18+), fallback ke node-fetch
let fetchImpl = global.fetch;
if (!fetchImpl) {
  try {
    fetchImpl = require("node-fetch");
  } catch (e) {
    console.warn(
      "Warning: fetch tidak tersedia. Install node-fetch atau pakai Node >=18."
    );
    fetchImpl = null;
  }
}

const sanitizeHtml = require("sanitize-html");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const axios = require("axios");
const FormData = require("form-data");

// ---- env/config ----
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini-2024-07-18";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const MAX_MODEL_TOKENS = parseInt(process.env.MAX_MODEL_TOKENS || "8000", 10);
const CONTINUE_ROUNDS = parseInt(process.env.CONTINUE_ROUNDS || "3", 10);

if (!OPENROUTER_API_KEY && !OPENAI_API_KEY) {
  console.warn(
    "Warning: OPENROUTER_API_KEY / OPENAI_API_KEY tidak diset. LLM calls akan gagal."
  );
}

// ---- uploads ----
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "audio/mpeg",
      "audio/wav",
      "audio/webm",
    ];
    if (!allowed.includes(file.mimetype))
      return cb(new Error("Unsupported file type"), false);
    cb(null, true);
  },
});

// ---- cache ----
const outlineCache = new Map();
const CACHE_LIMIT = 400;

// ---- helpers ----
function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function textToSegments(text) {
  const parsed = safeParseJson(text);
  if (parsed && Array.isArray(parsed.segments)) return parsed.segments;
  return [{ type: "text", text: String(text || "") }];
}

function sanitizeSegments(segments) {
  return (segments || []).map((s) => {
    const clean = sanitizeHtml(String(s?.text || ""), {
      allowedTags: [],
      allowedAttributes: {},
    });
    return { type: "text", text: clean };
  });
}

function segmentsToPlainText(segments) {
  if (!segments || !segments.length) return "";
  return segments.map((s) => s.text).join("\n\n");
}

// ---- LLM wrappers ----
async function callOpenRouter(body, timeoutMs = 25000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const resp = await fetchImpl(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });
  clearTimeout(t);
  if (!resp.ok)
    throw new Error(`OpenRouter ${resp.status}: ${await resp.text()}`);
  return await resp.json();
}

async function callOpenAI(body, timeoutMs = 25000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const resp = await fetchImpl(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });
  clearTimeout(t);
  if (!resp.ok) throw new Error(`OpenAI ${resp.status}: ${await resp.text()}`);
  return await resp.json();
}

async function callLLM({
  messages = [],
  model = OPENROUTER_MODEL,
  temperature = 0.4,
  max_tokens = 1200,
}) {
  if (OPENROUTER_API_KEY) {
    try {
      const data = await callOpenRouter({
        model,
        messages,
        temperature,
        max_tokens,
      });
      const content = data?.choices?.[0]?.message?.content;
      return { rawText: String(content || ""), provider: "openrouter" };
    } catch (err) {
      console.warn("OpenRouter gagal:", err.message);
    }
  }
  if (OPENAI_API_KEY) {
    const data = await callOpenAI({
      model: OPENAI_MODEL,
      messages,
      temperature,
      max_tokens,
    });
    const content = data?.choices?.[0]?.message?.content;
    return { rawText: String(content || ""), provider: "openai" };
  }
  throw new Error("Tidak ada LLM provider.");
}

function isLikelyTruncated(text) {
  if (!text) return false;
  const t = text.trim();
  return t.endsWith("...") || !/[.!?"]$/.test(t);
}

async function callLLMWithAutoContinue({
  initialMessages = [],
  model = OPENROUTER_MODEL,
  temperature = 0.4,
  max_tokens = MAX_MODEL_TOKENS,
}) {
  let accum = "";
  let { rawText, provider } = await callLLM({
    messages: initialMessages,
    model,
    temperature,
    max_tokens,
  });
  accum += rawText;
  for (let i = 0; i < CONTINUE_ROUNDS; i++) {
    if (!isLikelyTruncated(accum)) break;
    const cont = await callLLM({
      messages: [{ role: "user", content: "Lanjutkan jawaban sebelumnya." }],
      model,
      temperature,
      max_tokens,
    });
    accum += "\n\n" + cont.rawText;
  }
  return { rawText: accum, provider };
}

// ---- Context builder ----
function buildContextMessages({
  history = [],
  bab = "",
  topik = "",
  message = "",
  file = null,
  historySummary = null,
  contextTitle = null,
  contextText = null,
} = {}) {
  const systemBaseline = {
    role: "system",
    content: `Anda adalah dosen pembimbing akademik. Jawab alami, naratif, akademik, jangan template. Jika ada subbab, bahas isinya.`,
  };

  const truncatedHistory = (history || [])
    .filter(
      (h) => h && typeof h.content === "string" && h.content.trim() !== ""
    )
    .slice(-12)
    .map((h) => ({ role: h.role, content: String(h.content) }));

  const ctx = [systemBaseline];

  if (historySummary) {
    ctx.push({
      role: "system",
      content: `Ringkasan sebelumnya: ${historySummary}`,
    });
  }
  if (contextText) {
    ctx.push({
      role: "system",
      content: `📄 Subbab "${contextTitle || "Tanpa Judul"}":\n${String(
        contextText
      ).slice(0, 12000)}`,
    });
  }
  ctx.push(...truncatedHistory);
  ctx.push({
    role: "user",
    content: String(message || "").trim() || "(kosong)",
  });

  return ctx;
}

// ---- Core answer ----
async function produceAnswer({
  history = [],
  message = "",
  contextTitle = null,
  contextText = null,
} = {}) {
  // 🟡 Fallback: kalau user cuma jawab "iya/ok"
  if (/^(ya|iya|boleh|ok|oke|silakan|setuju)$/i.test(message.trim())) {
    const lastAi = [...history].reverse().find((m) => m.role === "assistant");

    const revisionPrompt = `
Mahasiswa mengiyakan tawaran Anda.
Sekarang berikan revisi nyata sesuai jawaban terakhir Anda.
- Jangan teori atau saran umum.
- Tampilkan versi lama lalu versi revisi.
- Fokus pada konteks subbab: "${contextTitle || "Tanpa Judul"}".
Jawaban terakhir AI:
"${lastAi?.content || ""}"`;

    const { rawText } = await callLLM({
      messages: [{ role: "user", content: revisionPrompt }],
      temperature: 0.4,
      max_tokens: 600,
    });

    let segments = sanitizeSegments(textToSegments(rawText));
    return {
      finalReplySegments: segments,
      replyPlain: segmentsToPlainText(segments) || rawText,
      provider: "openrouter",
      mode: "revision",
    };
  }

  // 🟢 Normal flow
  const contextMessages = buildContextMessages({
    history,
    message,
    contextTitle,
    contextText,
  });

  // Tambahkan instruksi auto-closure (selalu tutup dengan tawaran bantuan)
  const guidance = {
    role: "system",
    content: `
Jawablah seperti dosen pembimbing akademik.
- Naratif, kritis, natural, bukan template poin.
- Sertakan solusi nyata atau revisi kalimat/paragraf bila relevan.
- Tutup jawaban dengan pertanyaan tawaran bantuan yang spesifik.
  Contoh:
  - "Apakah kamu ingin saya bantu merevisi paragraf ini?"
  - "Mau saya tunjukkan format metodologi yang lebih tepat?"
  - "Perlu saya tambahkan contoh referensi yang sesuai?"
Bahasa: Indonesia.`,
  };

  const { rawText, provider } = await callLLMWithAutoContinue({
    initialMessages: [guidance, ...contextMessages],
    model: OPENROUTER_MODEL,
    temperature: 0.55,
    max_tokens: 1600,
  });

  let segments = sanitizeSegments(textToSegments(rawText));
  return {
    finalReplySegments: segments,
    replyPlain: segmentsToPlainText(segments) || rawText,
    provider,
    mode: "analysis",
  };
}

// ---- Routes ----
router.post("/chat-dosen", async (req, res) => {
  const {
    history = [],
    message = "",
    contextTitle = null,
    contextText = null,
  } = req.body || {};
  try {
    const { finalReplySegments, replyPlain, provider } = await produceAnswer({
      history,
      message,
      contextTitle,
      contextText,
    });
    return res.json({
      replySegments: finalReplySegments,
      reply: replyPlain,
      metadata: { provider },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({
      error: "Gagal terhubung AI.",
      details: String(err.message || err),
    });
  }
});

// ---- Upload ----
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  const filePath = req.file.path;
  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    let extractedText = "";
    if (ext === ".pdf") {
      extractedText = (await pdfParse(fs.readFileSync(filePath))).text;
    } else if (ext === ".docx") {
      extractedText = (await mammoth.extractRawText({ path: filePath })).value;
    } else if (ext === ".txt") {
      extractedText = fs.readFileSync(filePath, "utf8");
    } else {
      return res.status(400).json({ error: "Format tidak didukung." });
    }
    fs.unlinkSync(filePath);
    return res.json({ extractedText: String(extractedText || "").trim() });
  } catch (e) {
    fs.unlinkSync(filePath);
    return res.status(500).json({ error: "Gagal membaca file." });
  }
});

// ---- Transcribe ----
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Tidak ada audio." });
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(file.path));
    form.append("model", "whisper-1");
    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      form,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
      }
    );
    fs.unlinkSync(file.path);
    return res.json({ transcript: response.data.text });
  } catch (e) {
    fs.unlinkSync(file.path);
    return res.status(500).json({ error: "Gagal transkripsi." });
  }
});

module.exports = router;
