// src/data/repos/skripsiRepo.js
import { storage } from "../core/storage";
import { makeKey, NS } from "../core/namespaces";
import { withMeta } from "../core/versioning";
import { migrateDoc } from "../core/migrator";

const SKRIPSI_VERSION = 1;
const K = {
  BAB: (id) => makeKey(NS.SKRIPSI, `bab:${id}`),
  INDEX: makeKey(NS.SKRIPSI, "index"),
};

export const skripsiRepo = {
  loadBab(id) {
    const doc = storage.get(K.BAB(id), null);
    if (!doc) return null;
    return migrateDoc(doc, SKRIPSI_VERSION);
  },
  saveBab(id, data) {
    if (!data || (!data.text && !data.content)) return;
    storage.set(K.BAB(id), withMeta(data, SKRIPSI_VERSION));
  },
  listIndex() {
    return storage.get(K.INDEX, []);
  },
  saveIndex(indexList) {
    storage.set(K.INDEX, indexList);
  },
  clearAll() {
  const index = skripsiRepo.listIndex();
  index.forEach((bab) => storage.remove(K.BAB(bab.id)));
  storage.remove(K.INDEX);
}
};
