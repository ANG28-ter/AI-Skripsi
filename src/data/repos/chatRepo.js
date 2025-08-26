// src/data/repos/chatRepo.js
import { storage } from "../core/storage";
import { makeKey, NS } from "../core/namespaces";
import { withMeta } from "../core/versioning";
import { migrateDoc } from "../core/migrator";

const CHAT_VERSION = 1;
const K = {
  ACTIVE_ID: makeKey(NS.CHAT, "active_id"),
  CONVS: makeKey(NS.CHAT, "conversations"),
  DOC: (id) => makeKey(NS.CHAT, `conv:${id}`),
};

export const chatRepo = {
  getActiveId() {
    return storage.get(K.ACTIVE_ID, null);
  },
  setActiveId(id) {
    storage.set(K.ACTIVE_ID, id);
  },

  listConversations() {
    return storage.get(K.CONVS, []);
  },
  saveConversations(list) {
    storage.set(K.CONVS, list);
  },

  loadConversation(id) {
    const doc = storage.get(K.DOC(id), null);
    if (!doc) return null;
    return migrateDoc(doc, CHAT_VERSION);
  },

  saveConversation(id, data) {
    if (!data || !Array.isArray(data.messages)) return;

    // Pastikan metadata percakapan gak hilang
    const existingList = chatRepo.listConversations();
    const now = Date.now();

    const convMeta = {
      id,
      title: data.title || "Percakapan baru",
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    // Update list conversations
    const newList = [convMeta, ...existingList.filter((c) => c.id !== id)];
    chatRepo.saveConversations(newList);

    // Simpan detail lengkap di DOC
    storage.set(K.DOC(id), withMeta({ ...convMeta, ...data }, CHAT_VERSION));
  },

  deleteConversation(id) {
    storage.remove(K.DOC(id));
    const list = chatRepo.listConversations().filter((c) => c.id !== id);
    chatRepo.saveConversations(list);
    const active = chatRepo.getActiveId();
    if (active === id) chatRepo.setActiveId(null);
  },

  clearAll() {
    const list = chatRepo.listConversations();
    list.forEach((c) => storage.remove(K.DOC(c.id)));
    storage.remove(K.CONVS);
    storage.remove(K.ACTIVE_ID);
  },
};
