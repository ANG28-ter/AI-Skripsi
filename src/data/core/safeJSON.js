// src/data/core/safeJSON.js
export const safeParse = (raw, fallback = null) => {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch {
    return "";
  }
};
