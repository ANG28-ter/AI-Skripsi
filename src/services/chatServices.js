// src/services/chatService.js
import {
  saveField,
  loadField,
  clearFields,
} from "../services/firestoreService";
import { chatRepo } from "../data/repos/chatRepo";

// KUNCI INDEX DI FIRESTORE (list percakapan)
const FIELD_KEY = "chat_conversations";

/**
 * chatService = sinkronisasi localStorage (chatRepo) + Firestore
 */
export const chatServices = {
  async saveConversation(convId, data) {
    if (!convId || !data) return;

    // 1) Simpan ke local
    chatRepo.saveConversation(convId, data);

    // 2) Update daftar percakapan lokal
    let localList = chatRepo.listConversations() || [];
    if (!localList.find((c) => c.id === convId)) {
      localList = [
        ...localList,
        { id: convId, title: data.title || "Percakapan" },
      ];
      chatRepo.saveConversations(localList);
    }

    // 3) Sync ke Firestore (merge agar tidak overwrite)
    try {
      const remoteList = await loadField(FIELD_KEY);
      const merged = Array.isArray(remoteList)
        ? [
            ...localList,
            ...remoteList.filter((r) => !localList.some((l) => l.id === r.id)),
          ]
        : localList;

      await saveField(FIELD_KEY, merged); // index list
      await saveField(`${FIELD_KEY}_${convId}`, data); // detail isi
    } catch (e) {
      console.warn("⚠️ Gagal sync Firestore, tetap aman di local:", e);
    }
  },

  async loadConversation(convId) {
    if (!convId) return null;
    try {
      const conv = await loadField(`${FIELD_KEY}_${convId}`);
      if (conv) {
        chatRepo.saveConversation(convId, conv); // jaga local tetap up-to-date
        return conv;
      }
    } catch (e) {
      console.warn("⚠️ Gagal load dari Firestore, fallback local:", e);
    }
    return chatRepo.loadConversation(convId);
  },

  async deleteConversation(convId) {
    if (!convId) return;

    // 1) hapus local
    chatRepo.deleteConversation(convId);

    // 2) hapus remote + perbarui index
    try {
      await clearFields([`${FIELD_KEY}_${convId}`]);
      const list = chatRepo.listConversations() || [];
      await saveField(FIELD_KEY, list);
    } catch (e) {
      console.warn("⚠️ Gagal hapus di Firestore, local tetap aman:", e);
    }
  },

  async listConversations() {
    try {
      const list = await loadField(FIELD_KEY);
      if (Array.isArray(list)) {
        chatRepo.saveConversations(list); // sinkronkan ke local
        return list;
      }
    } catch (e) {
      console.warn("⚠️ Gagal load daftar chat dari Firestore:", e);
    }
    return chatRepo.listConversations() || [];
  },

  async clearAll() {
    chatRepo.clearAll();
    try {
      await clearFields([FIELD_KEY]); // hanya index; (opsional) tambahkan loop hapus detail jika perlu
    } catch (e) {
      console.warn("⚠️ Gagal clear di Firestore:", e);
    }
  },
};
