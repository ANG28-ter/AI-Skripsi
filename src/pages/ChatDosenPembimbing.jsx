// ChatDosenPembimbing.jsx
// Full refactor: safer, consistent abort handling, structured segments support,
// preserves original UI/features: sidebar, upload, transcribe, record, firestore hooks.

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  User,
  Plus,
  Search,
  Trash2,
  Copy,
  RotateCcw,
  LogOut,
  Send as LucideSend,
  Mic as LucideMic,
  Paperclip,
  MessageSquare,
  PanelLeft,
  PanelLeftClose,
  Square as LucideSquare,
  X,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import LoadingDots from "/src/components/LoadingDots";
import { loadField } from "../services/firestoreService";
import { useLocation } from "react-router-dom";
// import { chatRepo } from "../data/repos/chatRepo";
import { chatServices } from "../services/chatServices";
import { observeAuth } from "../services/auth";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth";
import MarkdownParagraphReadOnly from "../components/MarkdownParagraphFadeInReadOnly";

export default function ChatDosenPembimbing() {
  // ---------- Core state ----------
  const location = useLocation();
  const { contextType, contextKey, contextText, contextTitle } =
    location.state || {};
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get("mode") || "umum";
  const babId = queryParams.get("babId");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [typingText, setTypingText] = useState("");
  const typingRafRef = useRef(null);
  const [subbabContent, setSubbabContent] = useState("");
  const [hiddenContext, setHiddenContext] = useState(null);

  // file / upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileText, setUploadedFileText] = useState("");

  // audio
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recognition, setRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // login & logout
  const [showConfirm, setShowConfirm] = useState(false);
  const [user, setUser] = useState(null);

  // conversation / sidebar
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  // conversations list now always fetched via chatServices (dual storage)
  const [conversations, setConversations] = useState([]);
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // active id tetap di-hold di local (biar cepat & tidak perlu network)
  // state
  const [activeConversationId, setActiveConversationId] = useState(null);
  const DOSEN_CONV_ID = "conv_tanya_dosen";

  // efek pertama kali jalan, load daftar & set active
  useEffect(() => {
    (async () => {
      const list = await chatServices.listConversations();
      setConversations(Array.isArray(list) ? list : []);
      if (list?.length && !activeConversationId) {
        setActiveConversationId(list[0].id);
      }
    })();
  }, []);

  // init kosong
  const [messages, setMessages] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);

  // efek jalan ketika activeConversationId berubah
  useEffect(() => {
    if (activeConversationId) {
      chatServices.loadConversation(activeConversationId).then((conv) => {
        if (conv?.messages) {
          setMessages((prev) => {
            // kalau ada systemMessage baru di prev, jangan dihapus
            const merged = [...conv.messages];

            // tambahin semua msg yang ada di prev tapi belum ada di conv
            prev.forEach((m) => {
              if (
                !merged.find(
                  (x) => x.content === m.content && x.role === m.role
                )
              ) {
                merged.push(m);
              }
            });

            return merged;
          });
        }
      });
    }
  }, [activeConversationId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [bab, setBab] = useState("Judul Skripsi");
  const [shouldScroll, setShouldScroll] = useState(false);

  // controllers
  const abortControllerRef = useRef(null);

  // refs for UI
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // ---------- Effects: load/save ----------
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // ✅ jangan tunggu activeConversationId; biarkan sinkronisasi messages -> conversation yang create ID-nya
  const convLoadedRef = useRef(false);

  useEffect(() => {
    convLoadedRef.current = true;
  }, []); // flag "sudah mount"

  useEffect(() => {
    if (!contextText) return;

    const systemMessage = {
      role: "system",
      content: `📄 Konteks terlampir: "${
        contextTitle || "Subbab"
      }"\n\n${contextText}\n\n💡 Silakan ajukan pertanyaan terkait konteks di atas. Subbab yang di kirim tidak dapat di kirim kembali, sudah otomatis tersimpan.`,
    };

    // update hiddenContext (biar backend selalu dapet konteks terbaru)
    const newCtx = { title: contextTitle, text: contextText };
    setHiddenContext(newCtx);
    localStorage.setItem("hiddenContext", JSON.stringify(newCtx));

    setMessages((prev) => {
      // cek apakah subbab ini sudah pernah disuntik
      const alreadyInjected = prev.some(
        (m) =>
          m.role === "system" &&
          m.content?.includes(contextText) &&
          m.content?.includes(contextTitle || "Subbab")
      );
      if (alreadyInjected) return prev;

      const next = [...prev, systemMessage];

      if (activeConversationId) {
        chatServices
          .saveConversation(activeConversationId, {
            id: activeConversationId,
            title:
              activeConversationId === DOSEN_CONV_ID
                ? "Tanya Dosen"
                : "Percakapan",
            messages: next,
            updatedAt: Date.now(),
          })
          .catch((err) => console.error("saveConversation error:", err));
      }

      return next;
    });

    if (!activeConversationId && mode === "tanya_dosen") {
      setActiveConversationId(DOSEN_CONV_ID);
    }
  }, [contextText, contextTitle, activeConversationId, mode]);

  //  detected auth login
  useEffect(() => {
    const unsub = observeAuth((u) => setUser(u));
    return unsub;
  }, []);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout(); // pake service auth.js
      navigate("/login", { replace: true }); // langsung lempar ke login
    } catch (err) {
      console.error("❌ Gagal logout:", err);
    }
  };

  // smooth scroll when new content

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;

    // kalau user deket banget ke bawah (≤ 50px dari bottom)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isNearBottom);
  };

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (autoScroll && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [messages, typingText, autoScroll]);

  // keep messages synced into conversations store
  useEffect(() => {
    (async () => {
      if (messages.length === 0) return;

      if (!activeConversationId) {
        if (mode === "tanya_dosen") {
          const conv = {
            id: DOSEN_CONV_ID,
            title: "Tanya Dosen",
            messages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await chatServices.saveConversation(DOSEN_CONV_ID, conv);

          const list = await chatServices.listConversations();
          setConversations(Array.isArray(list) ? list : []);
          setActiveConversationId(DOSEN_CONV_ID);
        } else {
          const id = `conv_${Date.now()}`;
          const conv = {
            id,
            // ⚡ awalnya pakai fallback, biar nggak kosong
            title: renameConversationFromMessages(messages),
            messages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await chatServices.saveConversation(id, conv);

          const list = await chatServices.listConversations();
          setConversations(Array.isArray(list) ? list : []);
          setActiveConversationId(id);
        }
      } else {
        // ✅ Jangan override title AI dengan fallback
        const existing = conversations.find(
          (c) => c.id === activeConversationId
        );

        const conv = {
          id: activeConversationId,
          title:
            activeConversationId === DOSEN_CONV_ID
              ? "Tanya Dosen"
              : existing?.title || "Percakapan baru", // pakai existing dulu
          messages,
          updatedAt: Date.now(),
        };

        await chatServices.saveConversation(activeConversationId, conv);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId ? { ...c, ...conv } : c
          )
        );
      }
    })();
  }, [messages, activeConversationId, mode]);

  // simpan ke localStorage tiap kali berubah
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem("lastActiveConversationId", activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const list = await chatServices.listConversations();
      if (cancelled) return;

      const safeList = Array.isArray(list) ? list : [];
      setConversations(safeList);

      // Jika sudah ada active, biarkan (hindari race)
      if (activeConversationId) return;

      // Jika ada preset "tanya dosen" biarkan preset yang menentukan active
      const hasPreset = !!localStorage.getItem("dosen_preset");
      if (hasPreset) return;

      const savedId = localStorage.getItem("lastActiveConversationId");
      const savedExists = savedId && safeList.some((c) => c.id === savedId);

      if (savedExists) {
        setActiveConversationId(savedId);
      } else if (safeList.length) {
        setActiveConversationId(safeList[0].id);
      } else {
        // tidak ada percakapan — biarkan null, jangan auto-create di bootstrap
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // pastikan hanya sekali di mount

  useEffect(() => {
    const preset = localStorage.getItem("dosen_preset");
    if (preset) {
      try {
        const data = JSON.parse(preset);
        const contextText =
          localStorage.getItem(`hasil_${data.contextKey}`) || "";

        const initialMessage = {
          role: "user",
          content: `Halo Dosen AI, saya ingin bertanya terkait ${data.judulBab}.`,
          createdAt: Date.now(),
        };

        const conv = {
          id: DOSEN_CONV_ID,
          title: `Tanya Dosen: ${data.judulBab}`,
          messages: [initialMessage],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        chatServices.saveConversation(DOSEN_CONV_ID, conv).then(async () => {
          const list = await chatServices.listConversations();
          setConversations(list || []);
          setActiveConversationId(DOSEN_CONV_ID);
          setMessages(conv.messages);

          sendMessage(initialMessage.content, null, null, {
            contextTitle: data.judulBab,
            contextText,
          });
        });

        localStorage.removeItem("dosen_preset");
      } catch (err) {
        console.error("❌ Gagal load preset Tanya Dosen:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (contextType === "subbab" && contextKey) {
      // ambil dari localStorage
      const saved = localStorage.getItem(`hasil_${contextKey}`);
      setSubbabContent(saved ? JSON.parse(saved) : "");
    }
  }, [contextType, contextKey]);

  // ---------- Utility helpers ----------

  const cleanMarkdown = (text) =>
    (text || "")
      .replace(/^(\*|-|#|>)+\s?/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/#+\s?/g, "")
      .trim();

  const fixSpacing = (text) =>
    (text || "").replace(/([a-z])\n(?=[A-Z])/g, "$1\n\n");

  const getFileExtension = (filename) => {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  };

  const renderFileIcon = (ext) => {
    const baseClass = "w-5 h-5";
    const colorMap = {
      pdf: "bg-pink-500",
      doc: "bg-blue-500",
      docx: "bg-blue-500",
      txt: "bg-gray-500",
    };
    const color = colorMap[ext] || "bg-white text-black";
    return (
      <div className={`${color} text-white p-2 rounded-lg`}>
        <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        </svg>
      </div>
    );
  };

  // ---------- Conversation helpers ----------
  const renameConversationFromMessages = (messagesList) => {
    if (!messagesList || messagesList.length === 0) return "Percakapan baru";

    // ambil pesan user pertama
    const firstUser = messagesList.find((m) => m.role === "user");
    const raw = String(firstUser?.content || "").trim();

    if (!raw) return "Percakapan baru";

    // potong maksimal 6 kata
    const words = raw.split(/\s+/);
    const limited = words.slice(0, 6).join(" ");

    return words.length > 5 ? limited + "..." : limited;
  };

  const openNewConversation = async () => {
    const id = `conv_${Date.now()}`;
    const conv = {
      id,
      title: "Percakapan baru", // ✅ string literal
      messages: [], // ✅ kosongin aja
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      // Simpan via chatServices (local + Firestore)
      await chatServices.saveConversation(id, conv);

      // Refresh list biar konsisten sama Firestore
      const list = await chatServices.listConversations();
      setConversations(Array.isArray(list) ? list : []);

      // Setelah list beres, set active & reset messages
      setActiveConversationId(id);
      setMessages([]);
      setSidebarOpen(false);
    } catch (err) {
      console.error("⚠️ Gagal buat percakapan baru:", err);
    }
  };

  const loadConversation = async (conv) => {
    if (!conv?.id) return;

    setActiveConversationId(conv.id);

    // Ambil versi terbaru dari Firestore atau local
    const full = await chatServices.loadConversation(conv.id);

    if (full?.messages?.length) {
      setMessages(full.messages);
    } else {
      setMessages([]);
      console.warn("⚠️ Percakapan kosong atau gagal load dari storage.");
    }
  };

  const deleteConversation = async (id) => {
    if (!id) return;
    if (!confirm("Hapus percakapan ini?")) return;

    try {
      await chatServices.deleteConversation(id);

      // refresh list setelah delete
      const list = await chatServices.listConversations();
      setConversations(Array.isArray(list) ? list : []);

      // reset state kalau conversation yang aktif dihapus
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("⚠️ Gagal menghapus percakapan:", err);
    }
  };

  const finalizeConversationTitle = async (convId) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;
    const title = renameConversationFromMessages(conv.messages || messages);

    // update local list state
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, title, updatedAt: Date.now() } : c
      )
    );

    // persist index + detail
    const current = await chatServices.loadConversation(convId);
    await chatServices.saveConversation(convId, {
      ...(current || {}),
      id: convId,
      title,
      messages: (current?.messages ?? conv?.messages ?? messages) || [],
      updatedAt: Date.now(),
    });

    // refresh index to keep parity
    const list = await chatServices.listConversations();
    setConversations(Array.isArray(list) ? list : []);
  };

  // ---------- File upload handlers ----------
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error(`Upload failed ${res.status}`);

      const data = await res.json();

      // ✅ Validasi isi
      const extracted = String(data.extractedText || "").trim();
      if (!extracted || extracted.length < 30) {
        alert(
          "⚠️ File berhasil diupload tapi teks terlalu sedikit atau kosong. " +
            "Pastikan formatnya PDF/DOCX/TXT yang bisa dibaca."
        );
        setUploadedFileName(file.name);
        setUploadedFileText("");
        return;
      }

      // ✅ Simpan hasil
      setUploadedFileName(file.name);
      setUploadedFileText(extracted);

      // ✅ Preview kecil di console (buat dev/debugging)
      console.log(
        "📄 File berhasil dibaca:",
        file.name,
        "Preview:",
        extracted.slice(0, 300) + (extracted.length > 300 ? "..." : "")
      );
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Terjadi kesalahan saat upload. Coba lagi atau ganti format file.");
      setSelectedFile(null);
      setUploadedFileName("");
      setUploadedFileText("");
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadedFileName("");
    setUploadedFileText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) {
        handleSubmit(e);
      }
    }
  };

  // ---------- Audio record & transcribe ----------
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser kamu tidak mendukung Speech Recognition.");
      return;
    }

    const recog = new SpeechRecognition();
    recog.lang = "id-ID"; // bisa ganti ke "en-US" kalau mau bahasa Inggris
    recog.continuous = true; // biar jalan terus
    recog.interimResults = true; // biar teks muncul live sebelum fix

    recog.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript); // update ke input chat
    };

    recog.onerror = (event) => {
      console.error("SpeechRecognition error:", event.error);
      setIsListening(false);
    };

    recog.onend = () => {
      setIsListening(false);
    };

    recog.start();
    setRecognition(recog);
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // ---------- Typing animation (string-based) ----------
  const typeTextResponse = useCallback(
    (text, prevMessages = [], titleFromAI = null, segments = null) => {
      const rawText =
        segments && segments.length
          ? segments.map((s) => s.text).join("\n\n")
          : String(text || "");
      const cleaned = rawText;
      let i = 0;
      const chunkSize = 8;
      setTypingText("");

      if (typingRafRef.current) cancelAnimationFrame(typingRafRef.current);

      const step = () => {
        i += chunkSize;
        setTypingText(cleaned.slice(0, i));
        if (i < cleaned.length) {
          typingRafRef.current = requestAnimationFrame(step);
        } else {
          // finalize: push assistant message (prefer segments)
          const assistantMsg =
            segments && segments.length
              ? { role: "assistant", segments }
              : { role: "assistant", content: cleaned };

          const finalMessages = [...prevMessages, assistantMsg];
          setMessages(finalMessages);
          setTypingText("");
          typingRafRef.current = null;
          setShouldScroll(true);

          // persist conversation detail via services (ignore await)
          if (activeConversationId) {
            chatServices
              .saveConversation(activeConversationId, {
                id: activeConversationId,
                messages: finalMessages,
                updatedAt: Date.now(),
                ...(titleFromAI ? { title: titleFromAI } : {}),
              })
              .catch(() => {});
          }

          // update local list title if provided
          if (activeConversationId && titleFromAI) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversationId
                  ? { ...c, title: titleFromAI, updatedAt: Date.now() }
                  : c
              )
            );
          }
        }
      };

      typingRafRef.current = requestAnimationFrame(step);
    },
    [activeConversationId]
  );

  // ---------- Network: send message ----------
  const sendToServer = async (payload, signal) => {
    const res = await fetch("http://localhost:3001/chat-dosen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Server ${res.status} ${txt}`);
    }
    return res.json();
  };

  // main send function (used by handleSend & handleSubmit)
  // helper utama untuk kirim pesan (bisa dipakai manual / auto dari preset)
  const sendMessage = async (
    content,
    file = null,
    signal = null,
    extra = {}
  ) => {
    if (!content && !file) return;

    const safeFile = file || null;

    const userMessage = {
      role: "user",
      content: content?.trim() || "(Tidak ada pertanyaan)",
      file: safeFile,
    };

    // ✅ pastikan conv id target jelas
    let targetConvId =
      mode === "tanya_dosen" ? DOSEN_CONV_ID : activeConversationId;
    if (!targetConvId) {
      // auto-create conversation baru
      targetConvId = `conv_${Date.now()}`;
      const newConv = {
        id: targetConvId,
        title: "Percakapan baru",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // simpan ke state & local
      setActiveConversationId(targetConvId);
      setConversations((prev) => [newConv, ...prev]);
      localStorage.setItem("chat_dosen_active_conv", targetConvId);
    }

    // simpan userMessage ke state
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setShouldScroll(true);
    setLoading(true);

    // kalau sudah ada conversation aktif → update storage
    if (targetConvId) {
      setActiveConversationId(targetConvId);
      await chatServices.saveConversation(targetConvId, {
        id: targetConvId,
        title: targetConvId === DOSEN_CONV_ID ? "Tanya Dosen" : "Percakapan",
        messages: newMessages,
        updatedAt: Date.now(),
      });
    }

    try {
      // ✅ pastikan hiddenContext ikut terkirim (subbab terbaru selalu ikut)
      const payload = {
        threadId: targetConvId,
        history: newMessages,
        message: userMessage.content,
        topik: "",
        bab:
          mode === "skripsi" && bab && String(bab).trim().length > 0 ? bab : "",
        file: safeFile,
        mode,
        contextTitle: extra.contextTitle || hiddenContext?.title || null,
        contextText: extra.contextText || hiddenContext?.text || null,
      };

      const data = await sendToServer(payload, signal);

      const segments = data.replySegments || null;
      const summaryText = data.title || null;

      typeTextResponse(
        data.reply || null,
        newMessages,
        summaryText,
        segments || null
      );

      // update judul conv
      if ((activeConversationId || targetConvId) && summaryText) {
        const cid = activeConversationId || targetConvId;
        setConversations((prev) =>
          prev.map((c) =>
            c.id === cid
              ? { ...c, title: summaryText, updatedAt: Date.now() }
              : c
          )
        );
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "[Permintaan dibatalkan]" },
        ]);
      } else {
        console.error("Chat Error:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Gagal menjawab." },
        ]);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const loadContextText = (key) => {
    if (!key) return "";
    return localStorage.getItem(`hasil_${key}`) || "";
  };

  // dipakai user saat klik tombol kirim
  const handleSend = async (signal) => {
    if (!input.trim()) return;

    // inject subbab content dari localStorage
    const contextText = loadContextText(contextKey);

    const safeFile =
      uploadedFileName && uploadedFileText
        ? { name: uploadedFileName, content: uploadedFileText }
        : null;

    await sendMessage(input, safeFile, signal, {
      contextTitle,
      contextText, // AI dosen punya akses isi subbab
    });

    setInput("");
    setSelectedFile(null);
    setUploadedFileName("");
    setUploadedFileText("");
  };

  // kirim pesan dengan override teks (untuk quick replies)
  const sendQuick = async (text) => {
    if (!text?.trim()) return;
    const safeFile =
      uploadedFileName && uploadedFileText
        ? { name: uploadedFileName, content: uploadedFileText }
        : null;

    await sendMessage(text, safeFile, null, {
      contextTitle: hiddenContext?.title || contextTitle || null,
      contextText: hiddenContext?.text || loadContextText(contextKey) || null,
    });
  };

  // wrapper used by submitting form
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (loading) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);

    try {
      await handleSend(controller.signal);

      // auto-generate title if needed
      if (activeConversationId) {
        const conv = conversations.find((c) => c.id === activeConversationId);
        if (
          !conv?.title ||
          conv.title.trim() === "" ||
          conv.title === "Percakapan baru"
        ) {
          setTimeout(
            () => finalizeConversationTitle(activeConversationId),
            800
          );
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Pengiriman dibatalkan");
      } else {
        console.error("Send submit error", err);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (typingRafRef.current) {
      cancelAnimationFrame(typingRafRef.current);
      typingRafRef.current = null;
      setTypingText("");
    }
    try {
      abortControllerRef.current?.abort();
    } catch {}
    setLoading(false);
  };

  // reload / retry previous user input at index
  const handleReload = async (index) => {
    const historyBefore = messages.slice(0, index);

    // ambil user message terakhir dari historyBefore
    const lastUserInput = [...historyBefore]
      .reverse()
      .find((m) => m.role === "user")?.content;

    if (!lastUserInput) return;

    setLoading(true);
    try {
      const payload = {
        threadId: activeConversationId,
        history: historyBefore,
        message: lastUserInput,
        topik: "",
        bab: mode === "skripsi" ? bab : "",
        mode,
        persona: "prof_s3_tegas", // ✅ konsisten dengan produceAnswer
        contextTitle: hiddenContext?.title || null,
        contextText: hiddenContext?.text || null,
      };

      const data = await sendToServer(payload, null);
      const segments = data.replySegments || null;

      const newMsg =
        segments && segments.length
          ? { role: "assistant", segments }
          : {
              role: "assistant",
              content: cleanMarkdown(data.reply || "Gagal menjawab."),
            };

      const next = [...historyBefore, newMsg];
      setMessages(next);

      if (activeConversationId) {
        await chatServices.saveConversation(activeConversationId, {
          id: activeConversationId,
          messages: next,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.error("Reload error", err);
    } finally {
      setLoading(false);
    }
  };
  // ---------- UI actions ----------
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);

    // reset ke null setelah 2 detik
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRetry = (index) => handleReload(index);

  const handleClearChat = async () => {
    if (!confirm("Hapus semua chat?")) return;

    setMessages([]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId ? { ...c, messages: [] } : c
      )
    );

    if (activeConversationId) {
      const existing = await chatServices.loadConversation(
        activeConversationId
      );
      await chatServices.saveConversation(activeConversationId, {
        ...(existing || {}),
        id: activeConversationId,
        messages: [],
        updatedAt: Date.now(),
      });
    }
  };

  // ---------- Visible conversations filtered ----------
  const visibleConversations = (
    Array.isArray(conversations) ? conversations : []
  ).filter((c) => {
    if (!searchQuery.trim()) return true;
    return (c.title || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ---------- Rendering helpers: segments & legacy ----------
  const renderAssistantBubble = (msg) => {
    if (msg.segments && Array.isArray(msg.segments)) {
      return (
        <div className="prose prose-invert text-sm leading-relaxed">
          {msg.segments.map((s, idx) => {
            if (s.type === "highlight") {
              const cls = `highlight-${s.color || "yellow"}`;
              return (
                <div key={idx} className="mb-1">
                  <mark className={cls}>{s.text}</mark>
                </div>
              );
            }
            return (
              <div key={idx} className="mb-1">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {s.text}
                </ReactMarkdown>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="prose prose-invert text-sm leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {fixSpacing(msg.content || "")}
        </ReactMarkdown>
      </div>
    );
  };

  // ---------- Lifecycle: load preset fields (optional) ----------
  useEffect(() => {
    if (mode !== "skripsi" || !babId) return;
    let isMounted = true;

    (async () => {
      try {
        const babContent = await loadField(`bab_${babId}`);
        if (
          isMounted &&
          typeof babContent === "string" &&
          babContent.trim().length > 0 &&
          babContent.trim() !== bab.trim()
        ) {
          setBab(babContent);
          console.info(`[BAB] Data bab_${babId} berhasil dimuat.`);
        } else {
          console.warn(
            `[BAB] Tidak overwrite state. Data kosong/sama. (babId: ${babId})`
          );
        }
      } catch (e) {
        console.error(`[BAB] Gagal load bab_${babId}:`, e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [mode, babId, bab]);

  // ---------- JSX ----------
  return (
    <div className="flex h-screen bg-gradient-to-b from-[#071422] via-[#071f23] to-[#051018] text-white">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 transition-all duration-300 ${
          sidebarOpen ? "w-80" : "w-16"
        } bg-neutral-900/40 backdrop-blur-md border-r border-neutral-800/50 shadow-lg`}
      >
        <div className="h-full flex flex-col">
          {sidebarOpen && (
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar bulat */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow text-white font-bold">
                  {user?.displayName?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() || (
                      <User className="w-5 h-5" />
                    )}
                </div>
                <div>
                  <div className="font-semibold">
                    {user?.displayName || user?.email || "Pengguna"}
                  </div>
                  <div className="text-xs text-neutral-300">
                    {user ? "Akun Anda" : "Belum login"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md hover:bg-neutral-800/40 flex items-center justify-center"
                title="Tutup sidebar"
              >
                <PanelLeftClose className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {/* Tombol atas */}
          <div className="px-3 py-3">
            {sidebarOpen ? (
              <>
                <button
                  onClick={openNewConversation}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 text-emerald-300" />
                  <span className="text-sm">Obrolan Baru</span>
                </button>

                <div className="mt-3 relative">
                  <div className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari obrolan..."
                    className="w-full pl-10 pr-3 py-2 rounded-md bg-neutral-800/40 text-sm outline-none"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="w-11 h-11 flex items-center justify-center rounded-md bg-neutral-800/70 hover:bg-neutral-700/90 transition shadow-lg"
                  title="Buka sidebar"
                >
                  <PanelLeft className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={openNewConversation}
                  className="w-11 h-11 flex items-center justify-center rounded-md bg-neutral-800/70 hover:bg-neutral-700/90 transition shadow-lg"
                  title="Obrolan Baru"
                >
                  <Plus className="w-5 h-5 text-emerald-300" />
                </button>
              </div>
            )}
          </div>

          {/* Daftar percakapan */}
          <div className="flex-1 overflow-y-auto custom-scroll p-2">
            <style>{`.custom-scroll::-webkit-scrollbar{width:8px}.custom-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#10B981,#06B6D4);border-radius:8px}`}</style>
            <div className="space-y-2 py-2">
              {visibleConversations.length === 0 && (
                <div className="text-xs text-neutral-400 px-2">
                  Belum ada percakapan
                </div>
              )}
              {visibleConversations.map((conv) => {
                const active = conv.id === activeConversationId;
                return (
                  <motion.div
                    key={conv.id}
                    layout
                    className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer ${
                      active
                        ? "bg-emerald-600/10 border border-emerald-500/20"
                        : "hover:bg-white/5"
                    }`}
                    onClick={() => loadConversation(conv)}
                  >
                    <div className="w-8 h-8 rounded-md flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    {sidebarOpen && (
                      <div className="flex-1">
                        <div className="text-sm line-clamp-2">
                          {conv.title || "Percakapan baru"}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {new Date(
                            conv.updatedAt || conv.createdAt
                          ).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {sidebarOpen && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="p-1 rounded-md hover:bg-red-700/10"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-neutral-800/50">
            {sidebarOpen ? (
              <div className="flex items-center justify-between">
                <div className="text-xs text-neutral-300">
                  AI Dosen Pembimbing
                </div>
                <button
                  onClick={() => setShowConfirm(true)}
                  title="Logout"
                  className="p-2 rounded-md hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-2">
                <LogOut className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-neutral-900 text-white rounded-xl p-6 shadow-xl w-80">
            <h2 className="text-lg font-semibold mb-4">Konfirmasi Logout</h2>
            <p className="text-sm text-neutral-300 mb-6">
              Apakah anda yakin ingin logout?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm"
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 pl-2 py-4 border-b border-neutral-800 z-10 relative transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Dosen Pembimbing</h2>
              <p className="text-xs text-neutral-300">
                Konsultasi tugas — tegas & akademis
              </p>
            </div>
          </div>
        </header>

        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 custom-scroll"
        >
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  const isSystem = msg.role === "system";
                  const isRevision = msg.intent === "revision_given";
                  const endsWithQuestion =
                    msg.role === "assistant" &&
                    msg.content?.trim().endsWith("?");

                  return (
                    <motion.div
                      key={msg.id || i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      } group`}
                    >
                      {/* Avatar AI */}
                      {!isUser && !isSystem && (
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="max-w-[90%] sm:max-w-[82%]">
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            isUser
                              ? "bg-neutral-800/50 text-white"
                              : isSystem
                              ? "bg-neutral-700/30 text-neutral-300 italic text-xs"
                              : isRevision
                              ? "bg-green-900/30 border border-green-700 text-green-100"
                              : "text-neutral-100"
                          }`}
                          style={{ wordBreak: "break-word" }}
                        >
                          {isUser && (
                            <div style={{ whiteSpace: "pre-wrap" }}>
                              {msg.content}
                            </div>
                          )}
                          {isSystem && (
                            <div style={{ whiteSpace: "pre-wrap" }}>
                              {msg.content}
                            </div>
                          )}
                          {!isUser && !isSystem && (
                            <div>
                              {isRevision && (
                                <div className="text-green-400 font-bold mb-1">
                                  ✍️ Revisi dari Dosen:
                                </div>
                              )}
                              {renderAssistantBubble(msg, i)}
                            </div>
                          )}
                        </div>

                        {/* Hint kalau AI nanya balik */}
                        {endsWithQuestion && (
                          <div className="text-xs text-blue-400 italic mt-1">
                            💡 Dosen menunggu jawaban singkat kamu...
                          </div>
                        )}

                        {/* Quick reply */}
                        {endsWithQuestion && (
                          <div className="flex gap-2 mt-2">
                            {[
                              "Iya, pak",
                              "Boleh, tunjukkan",
                              "Tidak, sudah jelas",
                            ].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => sendQuick(opt)}
                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Actions (copy, retry) → berlaku untuk user & AI */}
                        {!isSystem && (
                          <div
                            className={`mt-2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-neutral-400 ${
                              isUser ? "justify-end" : ""
                            }`}
                          >
                            {/* Tombol Copy */}
                            <button
                              onClick={() =>
                                handleCopy(
                                  msg.segments
                                    ? msg.segments
                                        .map((s) => s.text)
                                        .join("\n\n")
                                    : msg.content || "",
                                  i
                                )
                              }
                              title="Salin teks"
                              className="flex items-center gap-1 px-2 py-1 rounded-md hover:text-emerald-300"
                            >
                              {copiedIndex === i ? (
                                <>
                                  <Check className="w-4 h-4 text-emerald-400" />
                                  <span className="text-emerald-400">
                                    Disalin
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                </>
                              )}
                            </button>

                            {/* Retry hanya untuk AI */}
                            {!isUser && (
                              <button
                                onClick={() => handleRetry(i)}
                                className="flex items-center gap-1 px-2 py-1 rounded-md hover:text-yellow-300"
                                title="Ulangi"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* File attachment */}
                        {msg.file && (
                          <div className="mt-3 flex items-center gap-3 text-xs text-neutral-300">
                            {renderFileIcon(getFileExtension(msg.file.name))}
                            <div className="flex-1 font-medium text-white text-sm">
                              {msg.file.name}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Loading state */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                  className="flex gap-4 items-start justify-start"
                >
                  <div className="max-w-[750px] flex flex-col">
                    <div className="px-4 py-3 rounded-2xl">
                      <LoadingDots />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Typing effect */}
              {typingText && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-cyan-400 shadow">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="max-w-[82%] text-sm text-neutral-100 leading-relaxed whitespace-pre-wrap">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {typingText}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {messages.length === 0 && (
                <div className="rounded-xl bg-white/5 backdrop-blur-sm p-6 text-sm text-neutral-300 shadow-inner">
                  <p className="mb-2 font-semibold text-white">
                    Cara menggunakan
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Tulis pertanyaan Anda di kolom bawah.</li>
                    <li>Opsional: lampirkan file PDF/DOCX/TXT.</li>
                    <li>
                      AI akan memberikan koreksi, saran, dan pertanyaan
                      lanjutan.
                    </li>
                  </ol>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
        {/* </div> */}

        {/* Footer / Composer */}
        <footer className="px-4 sm:px-6 lg:px-8 py-4 bg-neutral-900/10">
          <div className="max-w-3xl mx-auto">
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 mb-3 rounded-lg bg-neutral-800/40 border border-neutral-700">
                {renderFileIcon(
                  selectedFile.name.split(".").pop().toLowerCase()
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-neutral-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={removeSelectedFile}
                  className="p-1 rounded-md hover:bg-neutral-700"
                  title="Hapus file"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              className="flex items-center gap-3 rounded-full bg-neutral-800/40 px-4 py-2 border border-neutral-700"
            >
              <label
                htmlFor="upload-file"
                className="cursor-pointer flex-shrink-0 self-center"
              >
                <input
                  id="upload-file"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  hidden
                  onChange={handleFileUpload}
                />
                <Paperclip className="w-5 h-5 text-neutral-300 hover:text-emerald-300" />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (isListening) stopListening();
                  else startListening();
                }}
                title="Voice"
                className={`p-2 rounded-full hover:bg-neutral-800/60 transition-colors flex-shrink-0 self-center ${
                  isListening
                    ? "text-rose-400 animate-pulse"
                    : "text-neutral-300"
                }`}
              >
                <LucideMic className="w-5 h-5" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onKeyDown={handleKeyDown}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                placeholder="Tanyakan apa saja — contoh: mohon koreksi metodologi saya..."
                className="flex-1 bg-transparent outline-none text-sm placeholder-neutral-500 resize-none overflow-hidden leading-5 self-center"
                rows={1}
                style={{ maxHeight: "200px", minHeight: "20px" }}
                disabled={loading}
              />

              <button
                type={loading ? "button" : "submit"}
                onClick={loading ? handleStop : undefined}
                title={loading ? "Hentikan" : "Kirim"}
                className={`p-2 rounded-full shadow-lg flex items-center justify-center self-center transition-all ${
                  loading
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110"
                }`}
              >
                {loading ? (
                  <LucideSquare className="w-5 h-5 text-white" />
                ) : (
                  <LucideSend className="w-5 h-5 text-white" />
                )}
              </button>
            </form>

            <div className="mt-2 flex justify-end">
              <button
                onClick={handleClearChat}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus Semua Chat</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
