// src/data/tools/backupRestore.js
export const exportAll = () => {
  const dump = {};
  Object.keys(localStorage).forEach((k) => {
    if (!k.startsWith("skripsiapp:")) return;
    dump[k] = localStorage.getItem(k);
  });
  const blob = new Blob([JSON.stringify(dump, null, 2)], {
    type: "application/json",
  });
  return blob;
};

export const importAll = async (file) => {
  const text = await file.text();
  const dump = JSON.parse(text);
  Object.entries(dump).forEach(([k, v]) => {
    localStorage.setItem(k, v);
  });
  return true;
};
