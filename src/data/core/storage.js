// src/data/core/storage.js
import { safeParse, safeStringify } from "./safeJSON";

const getLS = () => (typeof window !== "undefined" ? window.localStorage : null);

export const storage = {
  get(key, fallback = null) {
    const ls = getLS();
    if (!ls) return fallback;
    const raw = ls.getItem(key);
    if (!raw) return fallback;
    return safeParse(raw, fallback);
  },
  set(key, value) {
    const ls = getLS();
    if (!ls) return;
    const raw = safeStringify(value);
    if (!raw) return;
    ls.setItem(key, raw);
  },
  remove(key) {
    const ls = getLS();
    if (!ls) return;
    ls.removeItem(key);
  },
  has(key) {
    const ls = getLS();
    if (!ls) return false;
    return ls.getItem(key) !== null;
  },
};
