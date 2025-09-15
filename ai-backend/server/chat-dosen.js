// backend/routes/chat-dosen.js
// V3: Chat-dosen dengan logika ala ChatGPT + persona dosen Indonesia

require("dotenv").config();

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Tesseract = require("tesseract.js");

let fetchImpl = global.fetch;
if (!fetchImpl) {
  try {
    fetchImpl = require("node-fetch");
  } catch {}
}

const sanitizeHtml = require("sanitize-html");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const axios = require("axios");
const FormData = require("form-data");

// ==== Config ====
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini-2024-07-18";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const MAX_MODEL_TOKENS = parseInt(process.env.MAX_MODEL_TOKENS || "8000", 10);
const CONTINUE_ROUNDS = parseInt(process.env.CONTINUE_ROUNDS || "3", 10);

// ==== Uploads ====
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
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"), false);
    }
    cb(null, true);
  },
});

// ==== Memory Store (thread-aware) ====
// patch: tambahin memori in-memory biar mirip ChatGPT
const MEM = {
  threads: new Map(), // { threadId -> { turns: [], docs: Map(), ... } }
};

// patch: fallback-safe getThread
function getThread(threadId) {
  const key = threadId || "__default__";
  if (!MEM.threads.has(key)) {
    MEM.threads.set(key, {
      turns: [], // selalu ada array kosong
      docs: new Map(),
      docOrder: [],
      summaries: new Map(),
      lastUsedDocIds: [],
      title: "",
    });
  }
  const thread = MEM.threads.get(key);
  // patch: safety kalau turns somehow null
  if (!Array.isArray(thread.turns)) thread.turns = [];
  return thread;
}

// ==== Small utils ====
function sha256(s) {
  return crypto
    .createHash("sha256")
    .update(String(s || ""), "utf8")
    .digest("hex");
}
function clampText(s, max = 12000) {
  s = String(s || "");
  return s.length > max ? s.slice(0, max) : s;
}
function safeJsonParse(x) {
  try {
    return JSON.parse(x);
  } catch {
    return null;
  }
}
function textToSegments(text) {
  const parsed = safeJsonParse(text);
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
function segmentsToPlain(segments) {
  if (!segments?.length) return "";
  return segments.map((s) => s.text).join("\n\n");
}
function likelyTruncated(t) {
  if (!t) return false;
  const x = t.trim();
  return x.endsWith("...") || (x.length > 100 && !/[.!?"]$/.test(x));
}

// ==== LLM wrappers ====
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
  max_tokens = 3000,
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
    } catch (e) {
      console.warn("OpenRouter gagal:", e.message);
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
  throw new Error("Tidak ada LLM provider yang aktif.");
}
async function callLLMWithAutoContinue({
  initialMessages = [],
  model = OPENROUTER_MODEL,
  temperature = 0.6,
  max_tokens = MAX_MODEL_TOKENS,
}) {
  let { rawText } = await callLLM({
    messages: initialMessages,
    model,
    temperature,
    max_tokens,
  });
  let accum = rawText;
  for (let i = 0; i < CONTINUE_ROUNDS; i++) {
    if (!likelyTruncated(accum)) break;
    const cont = await callLLM({
      messages: [{ role: "user", content: "lanjutkan jawaban sebelumnya" }],
      model,
      temperature,
      max_tokens,
    });
    accum += "\n\n" + cont.rawText;
  }
  return { rawText: accum };
}

// ==== File context helpers ====
async function summarizeLongTextIfNeeded(raw, filename = "") {
  const text = String(raw || "")
    .replace(/\s+\n/g, "\n")
    .trim();
  if (!text) return { summary: "", quote: "" };
  const quote = clampText(text, 3000);

  if (text.length < 2500) return { summary: "", quote };

  const prompt = `
Anda adalah dosen pembimbing mahasiswa.
Ringkas dokumen berikut supaya lebih mudah dipahami sebagai konteks diskusi.
Fokus pada alur, tujuan, poin penting, dan potensi kelemahan.
Gunakan bahasa Indonesia yang natural.

Judul/Nama berkas: ${filename || "(tanpa nama)"}
------ TEKS DOKUMEN ------
${clampText(text, 12000)}
`;

  const { rawText } = await callLLM({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.35,
    max_tokens: 1800,
  });
  return { summary: String(rawText || "").trim(), quote };
}

// ==== Context builder ====
function buildContextMessages({
  history = [],
  message = "",
  contextTitle = null,
  contextText = null,
  file = null,
} = {}) {
  const ctx = [
    {
      role: "system",
      content: `
Anda adalah dosen pembimbing di Indonesia yang sangat tegas.
Gaya bicara: kritis, logis, akademik, suportif, tapi naratif (bukan template).
Tugas: memahami konteks mahasiswa, mengoreksi dengan detail, dan memberi saran konkrit.
      `.trim(),
    },
  ];

  // 🔹 Case: ada subbab + file → bandingkan
  if (contextText && file?.content?.trim()) {
    ctx.push({
      role: "system",
      content: `
📌 Mahasiswa meminta evaluasi & perbandingan.
Gunakan kedua sumber ini:

1. Subbab: "${contextTitle || "Tanpa Judul"}"
${clampText(contextText, 6000)}

2. Dokumen utama: ${file.name || "(tanpa nama)"}
${clampText(file.content, 9000)}
      `.trim(),
    });
  }

  // 🔹 Case: hanya subbab
  else if (contextText) {
    ctx.push({
      role: "system",
      content: `📄 Subbab "${contextTitle || "Tanpa Judul"}":\n${clampText(
        contextText,
        20000
      )}`,
    });
  }

  // 🔹 Case: hanya file
  else if (file?.content?.trim()) {
    ctx.push({
      role: "system",
      content: `📎 Dokumen "${file.name || "(tanpa nama)"}":\n${clampText(
        file.content,
        20000
      )}`,
    });
  }

  // 🔹 Tambahkan history (12 terakhir)
  const truncatedHistory = (history || [])
    .filter((h) => h?.content?.trim())
    .slice(-12)
    .map((h) => ({ role: h.role, content: String(h.content) }));

  ctx.push(...truncatedHistory);

  // 🔹 Tambahkan pesan user
  ctx.push({
    role: "user",
    content: String(message || "").trim() || "(kosong)",
  });

  return ctx;
}

// ==== Title builder ====
async function buildTitle({ message = "", file = null, contextTitle = null }) {
  // Ambil hint paling relevan
  const hint =
    (message || "").trim() ||
    (contextTitle || "").trim() ||
    (file?.name || "").trim();

  if (!hint) return "Percakapan baru";

  const prompt = `
  Buat judul obrolan yang SANGAT RINGKAS dan kuat.
  - Maksimal 45 karakter
  - Tidak ada tanda kutip
  - Gunakan bahasa alami, jelas, dan ringkas
  - Hindari kalimat panjang, cukup berupa frasa/topik utama

  Hint: "${hint}"
  `;

  let rawText = "";
  try {
    const { rawText: llmText } = await callLLM({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 40,
    });
    rawText = String(llmText || "");
  } catch (err) {
    console.error("❌ Gagal generate judul:", err);
    return "Percakapan baru";
  }

  // Clean up
  let title = rawText.replace(/["“”]/g, "").trim();

  // Batasin 45 karakter
  if (title.length > 45) {
    title = title.slice(0, 42).trim() + "...";
  }

  // Minimal panjang biar gak absurd
  if (title.length < 5) {
    title = hint.split(/\s+/).slice(0, 5).join(" ");
  }

  // Kapitalisasi awal
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return title;
}

// ==== Core answer ====
async function produceAnswer({
  history = [],
  message = "",
  contextTitle = null,
  contextText = null,
  file = null,
  threadId = "__default__",
} = {}) {
  const thread = getThread(threadId);
  if (file?.content?.trim()) {
    thread.docs.set(file.name, file.content);

    if (!thread.docOrder.includes(file.name)) {
      thread.docOrder.push(file.name);
    }

    // bikin ringkasan sekali aja
    if (!thread.summaries.has(file.name)) {
      const s = await summarizeLongTextIfNeeded(file.content, file.name);
      thread.summaries.set(file.name, s.summary);
    }
  }
  const effectiveHistory = [...(history || []), ...(thread.turns || [])];
  // === respon singkat (iya, ok) ===
  if (/^(ya|iya|boleh|ok|oke|silakan|setuju)$/i.test((message || "").trim())) {
    const lastAi = [...(effectiveHistory || [])]
      .reverse()
      .find((m) => m.role === "assistant");

    if (!lastAi) {
      return {
        replySegments: [
          {
            type: "text",
            text: "⚠️ Tidak ada jawaban sebelumnya untuk direvisi.",
          },
        ],
        replyPlain: "⚠️ Tidak ada jawaban sebelumnya untuk direvisi.",
        title: await buildTitle({ message, file, contextTitle }),
      };
    }

    const revisionPrompt = `
Mahasiswa menyetujui revisi.
Lanjutkan dengan memberi versi revisi konkrit dari jawaban Anda sebelumnya,
sertakan contoh kalimat lama → versi revisi + alasan singkat.

Jawaban AI sebelumnya:
"${lastAi?.content || ""}"
    `;

    const { rawText } = await callLLM({
      messages: [{ role: "user", content: revisionPrompt }],
      temperature: 0.45,
      max_tokens: 900,
    });

    const seg = sanitizeSegments(textToSegments(rawText));
    return {
      replySegments: seg,
      replyPlain: segmentsToPlain(seg) || rawText,
      title: await buildTitle({ message, file, contextTitle }),
    };
  }

  // === ringkas file kalau ada ===
  if (file?.content?.trim() && !thread.summaries.has(file.name)) {
    const s = await summarizeLongTextIfNeeded(file.content, file.name);
    thread.summaries.set(file.name, s.summary);
  }

  // === guidance dasar (persona dosen) ===
  const baseGuidance = {
    role: "system",
    content: `
Jawablah seperti dosen pembimbing akademik.
- Naratif, kritis, natural, bukan template poin.
- Sertakan solusi nyata atau revisi kalimat/paragraf bila relevan.`,
  };

  // Bangun konteks awal (tanpa file, karena file udah disimpan di thread)
  let ctx = buildContextMessages({
    history: effectiveHistory,
    message,
    contextTitle,
    contextText,
    file: null,
  });

  // 🔹 inject semua ringkasan dokumen yg udah ada
  thread.summaries.forEach((summary, name) => {
    if (summary?.trim()) {
      ctx.unshift({
        role: "system",
        content: `📑 Ringkasan dokumen "${name}": ${summary}`,
      });
    }
  });

  // 🔹 inject full dokumen (clamped biar gak overload)
  thread.docOrder.forEach((name) => {
    const doc = thread.docs.get(name);
    if (doc?.trim()) {
      ctx.push({
        role: "system",
        content: `📎 Dokumen "${name}":\n${clampText(doc, 15000)}`,
      });
    }
  });

  // 🔹 terakhir, susun initialMessages
  let initialMessages = [baseGuidance, ...ctx];

  // Mode perbandingan (opsional)
  if (/bandingkan|compare|perbandingan/i.test(message)) {
    initialMessages.unshift({
      role: "system",
      content: "Fokus ke perbandingan antar dokumen/subbab.",
    });
  }

  // === panggil LLM ===
  const { rawText } = await callLLMWithAutoContinue({
    initialMessages,
    model: OPENROUTER_MODEL,
    temperature: 0.65,
    max_tokens: 5000,
  });

  const seg = sanitizeSegments(textToSegments(rawText));
  return {
    replySegments: seg,
    replyPlain: segmentsToPlain(seg) || rawText,
    title: await buildTitle({ message, file, contextTitle }),
  };
}

// ==== Routes ====
router.post("/chat-dosen", async (req, res) => {
  const b = req.body || {};
  let threadId = b.threadId || b.conversationId;
  if (!threadId) {
    threadId =
      "srv_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 6);
  }
  const {
    history = [],
    message = "",
    contextTitle = null,
    contextText = null,
    file = null,
  } = b;
  try {
    const { replySegments, replyPlain, title } = await produceAnswer({
      history,
      message,
      contextTitle,
      contextText,
      file,
      threadId,
    });
    // patch: simpan ke thread memory
    const thread = getThread(threadId);
    thread.turns.push({ role: "user", content: message, ts: Date.now() });
    thread.turns.push({
      role: "assistant",
      content: replyPlain,
      ts: Date.now(),
    });
    if (thread.turns.length > 60) {
      thread.turns = thread.turns.slice(-60);
    }
    return res.json({
      replySegments,
      reply: replyPlain,
      title,
      metadata: { ok: true, threadId }, // patch: balikin threadId biar frontend bisa reuse
    });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({
      error: "Gagal terhubung AI.",
      details: String(err.message || err),
    });
  }
});

// Upload
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  const filePath = req.file.path;
  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    let extractedText = "";
    let note = "text";

    if (ext === ".pdf") {
      try {
        extractedText = (await pdfParse(fs.readFileSync(filePath))).text;
      } catch {}
    } else if (ext === ".docx") {
      try {
        extractedText = (await mammoth.extractRawText({ path: filePath }))
          .value;
      } catch {}
    } else if (ext === ".txt") {
      try {
        extractedText = fs.readFileSync(filePath, "utf8");
      } catch {}
    }

    if (!extractedText || extractedText.trim().length < 30) {
      extractedText = await Tesseract.recognize(filePath, "eng+ind").then(
        (r) => r.data.text
      );
      note = "ocr";
    }

    fs.unlinkSync(filePath);
    if (!extractedText.trim())
      return res.json({
        extractedText: "",
        note: "empty",
        message: "File tidak berisi teks terbaca.",
      });
    return res.json({ extractedText: String(extractedText).trim(), note });
  } catch (e) {
    try {
      fs.unlinkSync(filePath);
    } catch {}
    return res.status(500).json({ error: "Gagal membaca file." });
  }
});

module.exports = router;
