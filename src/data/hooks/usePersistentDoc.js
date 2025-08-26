// src/data/hooks/usePersistentDoc.js
import { useEffect, useRef, useState } from "react";
import { storage } from "../core/storage";
import { safeStringify } from "../core/safeJSON";

export const usePersistentDoc = ({
  key,
  initial,
  enableFirestore = false,
  firestorePath = null,
  pullFn,
  pushFn,
  debounceMs = 400,
  skipIfEmpty = true,
}) => {
  const [doc, setDoc] = useState(() => storage.get(key, initial));
  const [loading, setLoading] = useState(enableFirestore);
  const timerRef = useRef(null);
  const firstSyncDone = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!enableFirestore || !pullFn || !firestorePath) return;
      setLoading(true);
      const remote = await pullFn(firestorePath, null);
      if (mounted && remote) {
        setDoc(remote);
        storage.set(key, remote);
      }
      setLoading(false);
      firstSyncDone.current = true;
    })();
    return () => {
      mounted = false;
    };
  }, [key, enableFirestore, firestorePath, pullFn]);

  useEffect(() => {
    if (skipIfEmpty && (doc == null || safeStringify(doc) === "{}")) return;
    storage.set(key, doc);

    if (enableFirestore && firstSyncDone.current && pushFn && firestorePath) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        pushFn(firestorePath, doc);
      }, debounceMs);
    }
  }, [doc, key, enableFirestore, firestorePath, pushFn, debounceMs, skipIfEmpty]);

  return { doc, setDoc, loading };
};
