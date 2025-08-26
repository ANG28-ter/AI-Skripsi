// src/data/core/namespaces.js
export const APP_NS = "skripsiapp"; // ganti kalau mau
export const makeKey = (feature, name) => `${APP_NS}:${feature}:${name}`;

export const NS = {
  CHAT: "chat",
  SKRIPSI: "skripsi",
  PREFS: "prefs",
};
