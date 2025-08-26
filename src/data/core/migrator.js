// src/data/core/migrator.js
import { getMeta, withMeta } from "./versioning";

const migrations = {
  1: (oldData) => {
    return {
      ...oldData,
      messages: Array.isArray(oldData.messages) ? oldData.messages : [],
    };
  },
};

export const migrateDoc = (doc, targetVersion) => {
  if (!doc) return null;
  const meta = getMeta(doc);
  let current = meta.version || 0;
  let data = doc.data;

  while (current < targetVersion) {
    const next = current + 1;
    const fn = migrations[next];
    if (typeof fn === "function") {
      data = fn(data);
      current = next;
    } else {
      current = next;
    }
  }
  return withMeta(data, targetVersion);
};
