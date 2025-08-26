// backend/routes/chat-dosen.js
// Refactor: anti-template for short queries + proper subbab context injection
// Keeps compatibility with ChatDosenPembimbing frontend

require("dotenv").config();

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Prefer native fetch (Node 18+), fallback to node-fetch
let fetchImpl = global.fetch;
if (!fetchImpl) {
  try {
    fetchImpl = require("node-fetch");
  } catch (e) {
    console.warn(
      "Warning: native fetch not available and node-fetch not installed. Install node-fetch or use Node >=18."
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
    "Warning: neither OPENROUTER_API_KEY nor OPENAI_API_KEY set. LLM calls will fail."
  );
}

// ---- uploads ----
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
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

// ---- simple in-memory cache for outlines (dev) ----
const outlineCache = new Map();
const CACHE_LIMIT = 400;

// ---- helpers ----
function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    if (!text || typeof text !== "string") return null;
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function extractJsonBetweenMarkers(text) {
  if (!text || typeof text !== "string") return null;
  const start = text.indexOf("<!--EVAL_JSON_START-->");
  const end = text.indexOf("<!--EVAL_JSON_END-->");
  if (start !== -1 && end !== -1 && end > start) {
    const jsonStr = text
      .slice(start + "<!--EVAL_JSON_START-->".length, end)
      .trim();
    return safeParseJson(jsonStr);
  }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) return safeParseJson(objMatch[0]);
  return null;
}

function stripJsonMarkers(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/<!--EVAL_JSON_START-->[\s\S]*?<!--EVAL_JSON_END-->/, "")
    .trim();
}

function textToSegments(text) {
  const parsed = safeParseJson(text);
  if (parsed && Array.isArray(parsed.segments)) return parsed.segments;
  return [{ type: "text", text: String(text || "") }];
}

function sanitizeSegments(segments) {
  return (segments || []).map((s) => {
    const type = s?.type === "highlight" ? "highlight" : "text";
    const clean = sanitizeHtml(String(s?.text || ""), {
      allowedTags: [],
      allowedAttributes: {},
    });
    if (type === "highlight") {
      const color = ["yellow", "red", "green", "blue"].includes(s.color)
        ? s.color
        : "yellow";
      return { type: "highlight", text: clean, color };
    }
    return { type: "text", text: clean };
  });
}

function segmentsToPlainText(segments) {
  if (!segments || !segments.length) return "";
  return segments.map((s) => s.text).join("\n\n");
}

function detectExplicitTaskTypeOverride(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  if (t.includes("bukan skripsi") || t.includes("ini bukan skripsi"))
    return "lainnya";
  if (/\b(artikel|paper|paper ilmiah)\b/.test(t)) return "artikel";
  if (/\b(jurnal|journal)\b/.test(t)) return "jurnal";
  if (/\b(skripsi|tesis|disertasi)\b/.test(t)) return "skripsi";
  return null;
}

// persona prompts (dipertajam anti-template)
function personaSystemPrompt(persona = "prof_s3_tegas", taskType = "lainnya") {
  const docInfo =
    taskType && taskType !== "lainnya" ? `Jenis dokumen: ${taskType}.` : "";

  if (persona === "prof_s3_tegas") {
    return `Anda adalah Profesor S3 berpengalaman di bidang akademik. 
- Gaya: kritis, tegas, logis, fokus metodologi & validitas data.
- Jawaban naratif, mendalam, jangan keluarkan template poin-poin kaku.
- Akhiri setiap jawaban dengan 1 pertanyaan kritis, spesifik, sempit, agar mahasiswa terdorong untuk berpikir lebih dalam.
- Jika mahasiswa menjawab "iya" atau setuju, berikan revisi nyata berupa kalimat/paragraf yang lebih akademik.
${docInfo} Bahasa: Indonesia.`;
  }

  if (persona === "dosen_pembimbing_santun") {
    return `Anda adalah dosen pembimbing akademik yang ramah dan suportif. 
- Gaya: komunikatif, jelas, tetap akademik, tapi lebih lembut.
- Hindari template kaku. Jelaskan dengan narasi mengalir, seperti percakapan tatap muka.
- Akhiri jawaban dengan 1 pertanyaan singkat & mudah diiyakan (contoh: "Apakah kamu ingin saya tunjukkan contohnya?").
- Jika mahasiswa mengiyakan, berikan revisi nyata dalam bentuk contoh kalimat/paragraf yang bisa langsung dipakai.
${docInfo} Bahasa: Indonesia.`;
  }

  if (persona === "editor_bahasa") {
    return `Anda adalah editor bahasa akademik. 
- Fokus memperbaiki tata bahasa, struktur kalimat, konsistensi sitasi, dan gaya penulisan.
- Hindari template list. Gunakan narasi: tunjukkan versi lama vs versi revisi.
- Akhiri jawaban dengan pertanyaan ringan (misal: "Apakah kamu ingin saya perbaiki paragraf berikutnya juga?").
- Jika mahasiswa setuju, berikan revisi nyata langsung pada teks.
${docInfo} Bahasa: Indonesia.`;
  }

  // default fallback
  return `Anda adalah dosen pembimbing akademik. 
Jawaban naratif, natural, jangan template. 
${docInfo} Bahasa: Indonesia.`;
}

// ---- free-flow professor evaluation prompt (primary output: flowing narrative) ----
function professorEvaluationPromptFreeFlow(content, taskType = "lainnya") {
  const sample = String(content || "").slice(0, 16000);

  return `
Anda adalah Profesor S3 berpengalaman yang sedang membaca dan menilai sebuah tugas/pekerjaan mahasiswa.
Jenis tugas: ${taskType || "tidak disebutkan"}.

Instruksi:
- Baca teks tugas di bawah ini secara mendalam.
- Berikan komentar naratif yang mengalir (seperti dosen menilai secara lisan), bukan template poin.
- Sentuh aspek utama: 
  * kejelasan tujuan & rumusan masalah
  * ketepatan metodologi
  * analisis data & validitas
  * argumentasi teori
  * struktur bab
  * konsistensi penulisan & sitasi
- Nada tegas namun konstruktif (dorong mahasiswa memperbaiki, jangan hanya mengkritik).
- Hindari list kaku, gunakan bahasa mengalir.
- Sertakan **contoh revisi nyata** (misalnya perbaikan kalimat/paragraf yang lebih akademik).
- Akhiri jawaban dengan **pertanyaan kecil yang spesifik**, agar mahasiswa bisa merespons (misal: "Apakah kamu ingin saya tunjukkan revisi lebih detail untuk metodologi?").

Opsional untuk sistem (jika bisa):
Tambahkan di akhir block JSON ringkas yang merangkum poin penting (overview, rekomendasi utama, skor).
JSON HARUS dibungkus marker:

<!--EVAL_JSON_START-->
{ ...json... }
<!--EVAL_JSON_END-->

Contoh JSON:
{
  "overview": "ringkasan 1-2 kalimat",
  "top_recommendations": ["perbaiki metodologi", "perkuat sitasi"],
  "scores": {"research": 0, "writing": 0, "suitability": 0}
}

Teks tugas mahasiswa (cuplikan):
----
${sample}
----

Ingat:
- Utamakan jawaban naratif alami seperti percakapan dosen dengan mahasiswa.
- Sertakan revisi nyata bila memungkinkan.
- Tutup dengan pertanyaan yang memancing interaksi.
  `.trim();
}


// ---- LLM network wrappers ----
async function callOpenRouter(body, timeoutMs = 25000) {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
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
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      const err = new Error(`OpenRouter ${resp.status}: ${txt}`);
      err.status = resp.status;
      throw err;
    }
    return await resp.json();
  } finally {
    clearTimeout(t);
  }
}

async function callOpenAI(body, timeoutMs = 25000) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
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
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      const err = new Error(`OpenAI ${resp.status}: ${txt}`);
      err.status = resp.status;
      throw err;
    }
    return await resp.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * callLLM - primary wrapper (tries OpenRouter, then OpenAI)
 * returns: { rawText, provider, rawResponse }
 */
async function callLLM({
  messages = [],
  model = OPENROUTER_MODEL,
  temperature = 0.3,
  max_tokens = 1200,
} = {}) {
  if (!fetchImpl)
    throw new Error(
      "No fetch implementation available in Node. Install node-fetch or use Node >=18."
    );

  const body = { model, messages, temperature, max_tokens };

  if (OPENROUTER_API_KEY) {
    try {
      const data = await callOpenRouter(body);
      const content = data?.choices?.[0]?.message?.content;
      return {
        rawText: String(content || ""),
        provider: "openrouter",
        rawResponse: data,
      };
    } catch (err) {
      console.warn("OpenRouter call failed:", err.message || err.toString());
      // fallback to OpenAI if available
    }
  }

  if (OPENAI_API_KEY) {
    const openAiBody = {
      model: OPENAI_MODEL,
      messages,
      temperature,
      max_tokens,
    };
    const data = await callOpenAI(openAiBody);
    const content = data?.choices?.[0]?.message?.content;
    return {
      rawText: String(content || ""),
      provider: "openai",
      rawResponse: data,
    };
  }

  throw new Error(
    "No LLM provider available (missing OPENROUTER_API_KEY and OPENAI_API_KEY)."
  );
}

// detect truncated output (conservative)
function isLikelyTruncated(text) {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.endsWith("...")) return true;
  if (!/[.!?"]$/.test(trimmed)) return true;
  if (trimmed.includes("<!--EVAL_JSON_START-->")) return false;
  return false;
}

// auto-continue loop
async function callLLMWithAutoContinue({
  initialMessages = [],
  model = OPENROUTER_MODEL,
  temperature = 0.25,
  max_tokens = MAX_MODEL_TOKENS,
} = {}) {
  let accum = "";
  let providerUsed = null;

  const first = await callLLM({
    messages: initialMessages,
    model,
    temperature,
    max_tokens,
  });
  accum += first.rawText || "";
  providerUsed = first.provider;

  for (let i = 0; i < CONTINUE_ROUNDS; i++) {
    if (!isLikelyTruncated(accum)) break;
    const contPrompt =
      "Lanjutkan jawaban sebelumnya dari titik terakhir. Jangan ulang bagian yang sudah ditulis. Lanjutkan dengan detail dan contoh konkret jika perlu.";
    try {
      const cont = await callLLM({
        messages: [{ role: "user", content: contPrompt }],
        model,
        temperature,
        max_tokens,
      });
      accum += "\n\n" + (cont.rawText || "");
      providerUsed = providerUsed || cont.provider;
    } catch (err) {
      console.warn("Continuation failed:", err.message || err);
      break;
    }
  }

  return { rawText: accum, provider: providerUsed || null };
}

// ---- higher-level functions (summarize, classify, outline, produceAnswer) ----
async function summarizeHistory(history) {
  if (!history || history.length <= 6) return null;
  const prompt = `Ringkas konteks percakapan berikut menjadi 2-4 kalimat yang mewakili fokus riset/pertanyaan:\n\n${history
    .map((h) => `${h.role}: ${h.content}`)
    .join("\n\n")}`;
  try {
    const { rawText } = await callLLM({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 200,
    });
    return rawText;
  } catch (e) {
    console.warn("summarizeHistory failed:", e.message || e);
    return null;
  }
}

async function classifyIntent({
  message,
  historySummary = "",
  fileExcerpt = "",
} = {}) {
  const instruction = `Output JSON only with fields: {"label":"document_review|methodology_help|explain_concept|fix_editing|quick_advice|other","reason":"...","taskType":"skripsi|jurnal|artikel|lainnya","needsOutline":true|false"}`;
  const prompt = `${instruction}\n\nIsi:\n${message}\n\nKonteks singkat:\n${
    historySummary || "tidak ada"
  }\nLampiran (excerpt):\n${fileExcerpt || "tidak ada"}`;

  try {
    const { rawText } = await callLLM({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.0,
      max_tokens: 220,
    });
    const parsed = safeParseJson(rawText);
    if (parsed && parsed.label) {
      parsed.taskType = parsed.taskType || "lainnya";
      return parsed;
    }

    const t = (rawText || "").toLowerCase();
    const guess = {
      label: "other",
      reason: rawText || "fallback",
      taskType: "lainnya",
      needsOutline: false,
    };
    if (t.includes("metode") || t.includes("method")) {
      guess.label = "methodology_help";
      guess.needsOutline = true;
    } else if (t.includes("jurnal")) {
      guess.label = "document_review";
      guess.taskType = "jurnal";
      guess.needsOutline = true;
    } else if (t.includes("artikel") || t.includes("paper")) {
      guess.label = "document_review";
      guess.taskType = "artikel";
      guess.needsOutline = true;
    } else if (
      t.includes("proofread") ||
      t.includes("tata bahasa") ||
      t.includes("edit")
    ) {
      guess.label = "fix_editing";
    }
    return guess;
  } catch (e) {
    console.warn("classifyIntent error:", e.message || e);
    return {
      label: "other",
      reason: "classification_failed",
      taskType: "lainnya",
      needsOutline: false,
    };
  }
}

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
  content: `Anda adalah DOSEN PEMBIMBING akademik — formal, tegas, dan ilmiah. 
Jika ada lampiran subbab, **selalu kutip dan bahas isinya** dalam jawaban, jangan abaikan. 
Jawaban harus terasa manusiawi, bukan template. 
Singkat bila tanya singkat, rinci bila perlu.`,
};


  const truncatedHistory = (history || []).slice(-12).map((h) => {
    let content = String(h.content || "");
    if (h.file?.name && h.file?.content) {
      content += `\n\n[Lampiran: ${h.file.name}]\n${h.file.content}`;
    }
    return { role: h.role, content };
  });

  const ctx = [systemBaseline];

  if (historySummary) {
    ctx.push({
      role: "system",
      content: `Ringkasan konteks sebelumnya: ${historySummary}`,
    });
  }

  // ✅ injeksi subbab (server-side, supaya selalu terbaca model)
  if (contextText) {
    ctx.push({
      role: "system",
      content: `📄 Konteks Subbab "${contextTitle || "Tanpa Judul"}":\n${String(
        contextText
      ).slice(0, 12000)}`,
    });
  }

  ctx.push(...truncatedHistory);

const currentUser = {
  role: "user",
  content: `
Bab: ${bab || "tidak disebutkan"}
Topik: ${topik || "tidak disebutkan"}

${contextText ? `📄 Lampiran Subbab: "${contextTitle || "Tanpa Judul"}"\n${String(contextText).slice(0, 4000)}\n\n` : ""}

Pertanyaan:
${message}
${file?.name ? `\n\n[Lampiran: ${file.name}]\n${file.content.slice(0, 800)}` : ""}
  `,
};
  ctx.push(currentUser);

  return ctx;
}

async function getOrMakeOutline(conversationId, messagesForContext) {
  if (conversationId && outlineCache.has(conversationId))
    return outlineCache.get(conversationId).outline;

  const outlineSystem = {
    role: "system",
    content:
      "Saring konteks menjadi outline singkat: Kekurangan, Kelebihan, Rekomendasi (actionable). Output plain text.",
  };

  try {
    const { rawText } = await callLLM({
      messages: [outlineSystem, ...messagesForContext],
      temperature: 0.2,
      max_tokens: 400,
    });
    const outline = rawText;
    if (conversationId && outline) {
      outlineCache.set(conversationId, {
        outline,
        historyLen: (messagesForContext || []).length,
        updatedAt: Date.now(),
      });
      if (outlineCache.size > CACHE_LIMIT) {
        const oldest = Array.from(outlineCache.keys())[0];
        outlineCache.delete(oldest);
      }
    }
    return outline;
  } catch (e) {
    console.warn("outline generation failed:", e.message || e);
    return null;
  }
}

/**
 * produceAnswer:
 * - evaluationMode -> free-flow narrative (ChatGPT-like) + optional JSON block extraction
 * - normal -> persona with injected subbab context + optional outline
 * - anti-template behavior for short queries
 */
async function produceAnswer({
  conversationId = null,
  history = [],
  topik = "",
  bab = "",
  message = "",
  file = null,
  persona = "prof_s3_tegas",
  contextTitle = null,
  contextText = null,
} = {}) {
  const historySummary = await summarizeHistory(history);
  const fileExcerpt = file?.content ? String(file.content).slice(0, 400) : "";
  const intentObj = await classifyIntent({
    message,
    historySummary,
    fileExcerpt,
  });

  const explicit = detectExplicitTaskTypeOverride(String(message || ""));
  const lastUser = Array.isArray(history)
    ? [...history].reverse().find((m) => m.role === "user")
    : null;
  const lastOverride = detectExplicitTaskTypeOverride(lastUser?.content || "");
  const finalOverride = explicit || lastOverride || null;

  let taskType = "lainnya";
  if (finalOverride) taskType = finalOverride;
  else if (intentObj?.taskType && intentObj.taskType !== "lainnya")
    taskType = intentObj.taskType;

  // 🟡 Deteksi konfirmasi singkat (iya/boleh/setuju) → masuk mode revisi nyata
  if (
    /^(ya|iya|boleh|ok|oke|silakan|setuju)$/i.test(String(message || "").trim())
  ) {
    const lastAi = [...history].reverse().find((m) => m.role === "assistant");
    const revisionPrompt = `
Mahasiswa mengiyakan follow-up Anda.
Sekarang berikan revisi nyata sesuai konteks jawaban terakhir Anda.
- Jangan teori, langsung rewrite kalimat/paragraf.
- Tampilkan versi awal lalu versi revisi.
Jawaban terakhir AI:
"${lastAi?.content || ""}"
`;

    const { rawText } = await callLLM({
      messages: [{ role: "user", content: revisionPrompt }],
      temperature: 0.4,
      max_tokens: 500,
    });

    return {
      finalReplySegments: sanitizeSegments(textToSegments(rawText)),
      outline: null,
      intent: "revision_given",
      provider: "openrouter",
      replyPlain: rawText,
      taskType,
      evaluationMode: false,
      evaluationData: null,
    };
  }

  // 🔥 Anti-template: jika pertanyaan terlalu pendek, augment
  if (String(message || "").trim().length < 6) {
    message = `Pertanyaan singkat: "${(message || "").trim() || "(kosong)"}".
Gunakan konteks (jika ada): ${contextTitle || "Tanpa Judul"}.
Jawab ringkas (2-4 kalimat) dengan dugaan maksud penanya,
lalu akhiri dengan 1 pertanyaan spesifik, sempit, dan relevan.
Hindari kalimat template.`;
  }

  // evaluationMode untuk dokumen panjang / review metodologi
  const evaluationMode =
    !!file?.content ||
    String(message || "").length > 800 ||
    intentObj.label === "document_review" ||
    intentObj.label === "methodology_help";

  if (evaluationMode) {
    const evalPrompt = professorEvaluationPromptFreeFlow(
      file?.content || message,
      taskType
    );
    try {
      const { rawText, provider } = await callLLMWithAutoContinue({
        initialMessages: [{ role: "user", content: evalPrompt }],
        model: OPENROUTER_MODEL,
        temperature: 0.2,
        max_tokens: MAX_MODEL_TOKENS,
      });

      const evalJson = extractJsonBetweenMarkers(rawText);
      const narrativeOnly = stripJsonMarkers(rawText);
      const segments = sanitizeSegments(textToSegments(narrativeOnly));
      const replyPlain =
        segmentsToPlainText(segments) || String(narrativeOnly || "");

      return {
        finalReplySegments: segments,
        outline: null,
        intent: intentObj.label,
        provider,
        replyPlain,
        taskType,
        evaluationMode: true,
        evaluationData: evalJson || null,
      };
    } catch (e) {
      console.error("Evaluation mode failed:", e);
      // fallback ke normal flow
    }
  }

  // 🔹 Normal flow
  const systemPrompt = personaSystemPrompt(persona, taskType);
  const contextMessages = buildContextMessages({
    history,
    topik,
    bab,
    message,
    file,
    historySummary,
    contextTitle,
    contextText,
  });

  const useOutline =
    !!file ||
    !!bab ||
    !!topik ||
    !!contextText ||
    intentObj.label === "document_review" ||
    intentObj.label === "methodology_help" ||
    (message && message.length > 100);

  let outline = null;
  if (useOutline) {
    outline = await getOrMakeOutline(conversationId, contextMessages);
  }

  const finalSystem = {
    role: "system",
    content: `Jawablah seperti dosen pembimbing.
- Naratif, mengalir, akademik, tapi natural.
- Jangan keluarkan template poin-poin kaku.
- Akhiri jawaban dengan 1 pertanyaan singkat yang relevan & sempit.
Prefer returning JSON: {"segments":[{"type":"text","text":"..."}], "adviceSummary":"short"} 
Jika tidak bisa, kembalikan teks biasa. Bahasa: Indonesia.`,
  };

  const finalMessages = [
    finalSystem,
    { role: "system", content: systemPrompt },
    ...(outline ? [{ role: "assistant", content: outline }] : []),
    ...contextMessages,
    { role: "user", content: message },
  ];

  const { rawText, provider } = await callLLMWithAutoContinue({
    initialMessages: finalMessages,
    model: OPENROUTER_MODEL,
    temperature: 0.55, // 🎯 lebih variatif & natural
    max_tokens: Math.min(MAX_MODEL_TOKENS, 1600),
  });

  let segments = textToSegments(rawText);
  segments = sanitizeSegments(segments);
  const replyPlain = segmentsToPlainText(segments) || String(rawText || "");

  return {
    finalReplySegments: segments,
    outline,
    intent: intentObj.label,
    provider,
    replyPlain,
    taskType,
    evaluationMode: false,
    evaluationData: null,
  };
}

// ---- Routes ----
router.post("/chat-dosen", async (req, res) => {
  const {
    conversationId = null,
    history = [],
    message = "",
    topik = "",
    bab = "",
    file = null,
    persona = "prof_s3_tegas",
    // ✅ ambil konteks dari frontend
    contextTitle = null,
    contextText = null,
  } = req.body || {};

  // Tetap butuh message? Ya, tapi biarkan pendek; augment di server (anti-template).
  if (typeof message !== "string") {
    return res.status(400).json({ error: "Pesan tidak valid." });
  }

  try {
    const {
      finalReplySegments,
      outline,
      intent,
      provider,
      replyPlain,
      taskType,
      evaluationMode,
      evaluationData,
    } = await produceAnswer({
      conversationId,
      history,
      topik,
      bab,
      message,
      file,
      persona,
      contextTitle, // ✅ forward
      contextText, // ✅ forward
    });

    // Title generation if first message (best-effort)
    let title = null;
    if (!history || history.length === 0) {
      try {
        const tPrompt = `Buat judul 3-6 kata yang mewakili: ${String(
          message
        ).slice(0, 200)}`;
        const tResp = await callLLM({
          messages: [{ role: "user", content: tPrompt }],
          temperature: 0.25,
          max_tokens: 30,
          model: OPENROUTER_MODEL,
        });
        const rawTitle =
          tResp?.rawText || (typeof tResp === "string" ? tResp : "");
        title = String(rawTitle || "Percakapan baru")
          .split("\n")[0]
          .trim();
      } catch {
        title = "Percakapan baru";
      }
    }

    return res.json({
      replySegments: finalReplySegments,
      reply: replyPlain,
      outline,
      metadata: {
        intent,
        persona,
        provider,
        taskType,
        evaluationMode: !!evaluationMode,
      },
      evaluationData: evaluationData || null,
      title,
    });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({
      error: "Gagal terhubung dengan AI dosen.",
      details: String(err.message || err),
    });
  }
});

// ---- Upload endpoint ----
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  const filePath = req.file.path;
  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    let extractedText = "";
    if (ext === ".pdf") {
      const buf = fs.readFileSync(filePath);
      const parsed = await pdfParse(buf);
      extractedText = parsed?.text || "";
    } else if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result?.value || "";
    } else if (ext === ".txt") {
      extractedText = fs.readFileSync(filePath, "utf8");
    } else {
      try {
        fs.unlinkSync(filePath);
      } catch {}
      return res.status(400).json({ error: "Format file tidak didukung." });
    }
    try {
      fs.unlinkSync(filePath);
    } catch {}
    return res.json({ extractedText: String(extractedText || "").trim() });
  } catch (e) {
    console.error("Upload error:", e);
    try {
      fs.unlinkSync(filePath);
    } catch {}
    return res.status(500).json({ error: "Gagal membaca isi file." });
  }
});

// ---- Transcribe endpoint (OpenAI Whisper) ----
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "Tidak ada audio dikirim." });
  try {
    const audioStream = fs.createReadStream(file.path);
    const form = new FormData();
    form.append("file", audioStream);
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
    try {
      fs.unlinkSync(file.path);
    } catch {}
    return res.json({ transcript: response.data.text });
  } catch (e) {
    console.error("Transcribe error:", e);
    try {
      fs.unlinkSync(file.path);
    } catch {}
    return res.status(500).json({ error: "Gagal transkripsi suara." });
  }
});

module.exports = router;
