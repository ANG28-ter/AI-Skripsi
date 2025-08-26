// src/hooks/useChatDosenPembimbing.js
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { chatRepo } from "../data/repos/chatRepo";
import { loadField } from "../services/firestoreService";
import { cleanMarkdown } from "../utils/chatUtils";

export default function useChatDosenPembimbing() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get("mode") || "umum";
  const babId = queryParams.get("babId");

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [typingText, setTypingText] = useState("");
  const typingRafRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileText, setUploadedFileText] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState(
    chatRepo.listConversations()
  );
  const [activeConversationId, setActiveConversationId] = useState(
    chatRepo.getActiveId()
  );
  const [messages, setMessages] = useState(() => {
    return activeConversationId
      ? chatRepo.loadConversation(activeConversationId)?.messages || []
      : [];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [bab, setBab] = useState("Judul Skripsi");
  const [shouldScroll, setShouldScroll] = useState(false);

  const abortControllerRef = useRef(null);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  /** === Effects === */
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || !activeConversationId) return;
    if (!messages || messages.length === 0) return;
    chatRepo.saveConversation(activeConversationId, { messages });
  }, [messages, isLoaded, activeConversationId]);

  useEffect(() => {
    chatRepo.saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    if (chatEndRef.current && shouldScroll) {
      setTimeout(() => {
        chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 60);
      setShouldScroll(false);
    }
  }, [messages, typingText, shouldScroll]);

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

  /** === Utility === */
  const renameConversationFromMessages = (messagesList) => {
    const firstUser = messagesList.find((m) => m.role === "user");
    if (!firstUser) return "Percakapan baru";
    const text = String(firstUser.content || "")
      .trim()
      .replace(/\s+/g, " ");
    return text.length > 60 ? text.slice(0, 57) + "..." : text;
  };

  /** === Conversation handlers === */
  const openNewConversation = () => {
    const id = `conv_${Date.now()}`;
    const conv = {
      id,
      title: "Percakapan baru",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveConversationId(id);
    setMessages([]);
    chatRepo.setActiveId(conv.id);
    setSidebarOpen(false);
  };

  const loadConversation = (conv) => {
    setActiveConversationId(conv.id);
    if (conv.messages && conv.messages.length > 0) {
      setMessages(conv.messages);
    }
    chatRepo.setActiveId(conv.id);
  };

  const deleteConversation = (id) => {
    if (!confirm("Hapus percakapan ini?")) return;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
      chatRepo.setActiveId(null);
    }
  };

  const finalizeConversationTitle = (convId) => {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;
    const title = renameConversationFromMessages(conv.messages || messages);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, title, updatedAt: Date.now() } : c
      )
    );
  };

  /** === File Upload === */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("http://localhost:3001/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`Upload failed ${res.status}`);
      const data = await res.json();
      if (data.extractedText) {
        setUploadedFileName(file.name);
        setUploadedFileText(String(data.extractedText));
      } else {
        alert("Gagal mengekstrak file.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Terjadi kesalahan saat upload.");
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

  /** === Chat actions === */
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

  const handleSend = async (signal) => {
    if (!input.trim() && !uploadedFileText) return;
    const safeFile =
      uploadedFileName && uploadedFileText
        ? { name: uploadedFileName, content: uploadedFileText }
        : null;
    const userMessage = {
      role: "user",
      content: input || "(Tidak ada pertanyaan)",
      file: safeFile,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (activeConversationId) {
      chatRepo.saveConversation(activeConversationId, {
        messages: newMessages,
      });
    }
    setInput("");
    setSelectedFile(null);
    setUploadedFileName("");
    setUploadedFileText("");
    setLoading(true);
    setShouldScroll(true);

    try {
      const payload = {
        conversationId: activeConversationId || null,
        history: newMessages,
        message: userMessage.content,
        topik: "",
        bab:
          mode === "skripsi" && bab && String(bab).trim().length > 0 ? bab : "",
        file: safeFile,
        mode,
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

      if (data.title && activeConversationId) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, title: data.title, updatedAt: Date.now() }
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

  const typeTextResponse = useCallback(
    (text, prevMessages = [], titleFromAI = null, segments = null) => {
      const rawText =
        segments && segments.length
          ? segments.map((s) => s.text).join("\n\n")
          : String(text || "");
      let i = 0;
      const chunkSize = 8;
      setTypingText("");
      if (typingRafRef.current) cancelAnimationFrame(typingRafRef.current);

      const step = () => {
        i += chunkSize;
        setTypingText(rawText.slice(0, i));
        if (i < rawText.length) {
          typingRafRef.current = requestAnimationFrame(step);
        } else {
          const assistantMsg =
            segments && segments.length
              ? { role: "assistant", segments }
              : { role: "assistant", content: rawText };
          const finalMessages = [...prevMessages, assistantMsg];
          setMessages(finalMessages);
          setTypingText("");
          typingRafRef.current = null;
          setShouldScroll(true);
          if (activeConversationId) {
            chatRepo.saveConversation(activeConversationId, {
              messages: finalMessages,
            });
          }
          if (activeConversationId && titleFromAI) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversationId
                  ? {
                      ...c,
                      messages: finalMessages,
                      updatedAt: Date.now(),
                      title: titleFromAI,
                    }
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

  return {
    mode,
    babId,
    input,
    setInput,
    loading,
    setLoading,
    typingText,
    selectedFile,
    uploadedFileName,
    uploadedFileText,
    isRecording,
    setIsRecording,
    sidebarOpen,
    setSidebarOpen,
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    setMessages,
    searchQuery,
    setSearchQuery,
    bab,
    setBab,
    chatEndRef,
    textareaRef,
    shouldScroll,
    setShouldScroll,
    abortControllerRef,
    openNewConversation,
    loadConversation,
    deleteConversation,
    finalizeConversationTitle,
    handleFileUpload,
    removeSelectedFile,
    handleSend,
    sendToServer,
    typeTextResponse,
  };
}
