const DB_NAME = "collage-studio";
const STORE = "photos";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined")
      throw new Error("IndexedDB недоступен.");
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((error) => {
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}

async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function putPhoto(key: string, blob: Blob): Promise<void> {
  await run("readwrite", (store) => store.put(blob, key));
}

export async function getPhoto(key: string): Promise<Blob | undefined> {
  const value = await run<unknown>("readonly", (store) => store.get(key));
  return value instanceof Blob ? value : undefined;
}

export async function deletePhotosExcept(keep: Set<string>): Promise<void> {
  const keys = await run("readonly", (store) => store.getAllKeys());
  const stale = keys.filter(
    (key): key is string => typeof key === "string" && !keep.has(key),
  );
  if (stale.length)
    await run("readwrite", (store) => {
      stale.forEach((key) => store.delete(key));
      return store.count();
    });
}
