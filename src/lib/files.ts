import { supabase } from "@/lib/supabaseClient";

/** Tiny IndexedDB blob store so receipts/photos don't fill localStorage. */
const DB = "farmhelper-files";
const STORE = "blobs";

const open = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const tx = async <T,>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await open();
  return new Promise((resolve, reject) => {
    const r = fn(db.transaction(STORE, mode).objectStore(STORE));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
};

export type StoredFile = { fileId: string; name: string; type: string; size: number; /** location in cloud storage once uploaded */ path?: string };

export async function saveFile(file: File): Promise<StoredFile> {
  const fileId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await tx("readwrite", (s) => s.put(file, fileId));
  return { fileId, name: file.name, type: file.type, size: file.size };
}

export const getFile = (fileId: string) => tx<Blob | undefined>("readonly", (s) => s.get(fileId));
export const deleteFile = (fileId: string) => tx("readwrite", (s) => s.delete(fileId));

export async function openStored(f: StoredFile) {
  let blob: Blob | undefined = await getFile(f.fileId);
  if (!blob && f.path && supabase) {
    const { data, error } = await supabase.storage.from("farm-files").download(f.path);
    if (error || !data) throw new Error("Couldn’t download this file – check your connection");
    blob = data;
  }
  if (!blob) throw new Error("File not found on this device");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
