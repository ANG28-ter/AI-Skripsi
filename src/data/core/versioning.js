// src/data/core/versioning.js
export const withMeta = (data, version) => ({
  _meta: { version, updatedAt: Date.now() },
  data,
});

export const getMeta = (doc) => doc?._meta || { version: 0, updatedAt: 0 };
export const getData = (doc) => doc?.data ?? null;
