// src/services/storageService.js
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";

const storage = getStorage();

export async function uploadToStorage(path, data) {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, data, "raw");
  return path;
}

export async function downloadFromStorage(path) {
  const storageRef = ref(storage, path);
  const url = await getDownloadURL(storageRef);
  const res = await fetch(url);
  return await res.text();
}

export async function deleteFromStorage(path) {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}
