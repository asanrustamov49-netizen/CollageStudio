import { useEffect, useSyncExternalStore } from "react";
import { fontOptions, getInitialState, getTemplateById } from "@/data/templates";
import type { CollageState, CollageText, PhotoSlot } from "@/types/collage";
import { deletePhotosExcept, getPhoto, putPhoto } from "./photoStorage";

/**
 * Правки шаблона, сделанные в редакторе, с историей для отмены и повтора.
 * Текущее состояние сохраняется в localStorage (история — только в памяти вкладки),
 * файлы своих фото — в IndexedDB. Object URL загруженных фото не освобождаются,
 * пока на них может ссылаться история.
 */
export interface CollageDraft {
  past: CollageState[];
  present: CollageState;
  future: CollageState[];
  /** Ключ последней правки: правки с тем же ключом (ползунок, перетаскивание) склеиваются в один шаг. */
  mergeKey?: string;
}

const HISTORY_LIMIT = 50;
const STORAGE_PREFIX = "collage-studio:draft:v1:";
/** Ссылка на фото в IndexedDB внутри сохранённого состояния. */
const IDB_PREFIX = "idb:";

let drafts: Record<string, CollageDraft> = {};
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setDraft(id: string, draft: CollageDraft) {
  drafts = { ...drafts, [id]: draft };
  listeners.forEach((listener) => listener());
  schedulePersist(id);
}

/** Черновик шаблона. На сервере и при гидратации — undefined, сохранённый подгружается после. */
export function useCollageDraft(id: string): CollageDraft | undefined {
  useEffect(() => {
    void restoreDraft(id);
  }, [id]);
  return useSyncExternalStore(
    subscribe,
    () => drafts[id],
    () => undefined,
  );
}

/** Записывает новое состояние; `initial` используется, если черновика ещё нет. */
export function commitDraft(
  id: string,
  initial: CollageState,
  update: (current: CollageState) => CollageState,
  mergeKey?: string,
) {
  const draft = drafts[id] ?? { past: [], present: initial, future: [] };
  const next = update(draft.present);
  if (next === draft.present) return;
  if (mergeKey && draft.mergeKey === mergeKey) {
    setDraft(id, { ...draft, present: next, future: [] });
    return;
  }
  setDraft(id, {
    past: [...draft.past, draft.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
    mergeKey,
  });
}

export function undoDraft(id: string) {
  const draft = drafts[id];
  if (!draft?.past.length) return;
  setDraft(id, {
    past: draft.past.slice(0, -1),
    present: draft.past[draft.past.length - 1],
    future: [draft.present, ...draft.future],
  });
}

export function redoDraft(id: string) {
  const draft = drafts[id];
  if (!draft?.future.length) return;
  setDraft(id, {
    past: [...draft.past, draft.present],
    present: draft.future[0],
    future: draft.future.slice(1),
  });
}

/** Завершает склеиваемую правку: следующая станет отдельным шагом истории. */
export function endMerge(id: string) {
  if (drafts[id]?.mergeKey) drafts[id] = { ...drafts[id], mergeKey: undefined };
}

// --- Фото пользователя -------------------------------------------------------

/** Ключи IndexedDB для object URL, созданных в этой вкладке. */
const photoKeys = new Map<string, string>();
let cleanup: Promise<void> | null = null;

/**
 * Создаёт object URL для файла и пытается сохранить файл в IndexedDB.
 * `persisted: false` — фото видно сейчас, но после перезагрузки не восстановится.
 */
export async function registerPhoto(file: File): Promise<{ url: string; persisted: boolean }> {
  const url = URL.createObjectURL(file);
  const key = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await cleanup;
    await putPhoto(key, file);
    photoKeys.set(url, key);
    return { url, persisted: true };
  } catch {
    return { url, persisted: false };
  }
}

// --- Сохранение и восстановление -------------------------------------------

const timers = new Map<string, ReturnType<typeof setTimeout>>();

function schedulePersist(id: string) {
  if (typeof window === "undefined") return;
  clearTimeout(timers.get(id));
  timers.set(id, setTimeout(() => persist(id), 300));
}

function persist(id: string) {
  timers.delete(id);
  const draft = drafts[id];
  if (!draft) return;
  const photos = draft.present.photos.map((p) => {
    if (!p.src.startsWith("blob:")) return p;
    // Фото без копии в IndexedDB сохранить нельзя (null) — после перезагрузки вернётся фото шаблона.
    const photoKey = photoKeys.get(p.src);
    return { ...p, src: photoKey ? IDB_PREFIX + photoKey : null };
  });
  try {
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify({ photos, texts: draft.present.texts }));
  } catch {
    // Хранилище недоступно или переполнено: правки останутся только в этой вкладке.
  }
}


const restored = new Set<string>();

function readStorage(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return null;
  }
}

function removeStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Нечего делать: хранилище недоступно.
  }
}

/** Один раз за сессию удаляет из IndexedDB фото, на которые не ссылается ни один черновик. */
function cleanupPhotos() {
  cleanup ??= (async () => {
    const keep = new Set<string>();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(STORAGE_PREFIX)) continue;
        const saved = readStorage(key) as { photos?: { src?: unknown }[] } | null;
        for (const p of saved?.photos ?? []) {
          if (typeof p?.src === "string" && p.src.startsWith(IDB_PREFIX)) keep.add(p.src.slice(IDB_PREFIX.length));
        }
      }
      await deletePhotosExcept(keep);
    } catch {
      // Очистка не обязательна.
    }
  })();
  return cleanup;
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => [...timers.keys()].forEach(persist));
  void cleanupPhotos();
}

async function restoreDraft(id: string) {
  if (restored.has(id) || drafts[id]) return;
  restored.add(id);
  const template = getTemplateById(id);
  if (!template) return;
  const key = STORAGE_PREFIX + id;
  const saved = readStorage(key);
  if (saved === undefined) return;
  const initial = getInitialState(template);
  const parsed = parseSaved(saved, initial);
  if (!parsed) {
    removeStorage(key);
    return;
  }
  await cleanupPhotos();

  const photos = await Promise.all(
    parsed.photos.map(async (p, i): Promise<PhotoSlot> => {
      if (!p.src?.startsWith(IDB_PREFIX)) return { ...p, src: p.src ?? initial.photos[i].src };
      const photoKey = p.src.slice(IDB_PREFIX.length);
      const blob = await getPhoto(photoKey).catch(() => undefined);
      if (!blob) return { ...initial.photos[i] };
      const url = URL.createObjectURL(blob);
      photoKeys.set(url, photoKey);
      return { ...p, src: url };
    }),
  );
  // Пользователь мог начать правку, пока шла загрузка: его изменения важнее.
  if (drafts[id]) return;
  drafts = { ...drafts, [id]: { past: [], present: { photos, texts: parsed.texts }, future: [] } };
  listeners.forEach((listener) => listener());
}

// --- Проверка сохранённых данных ---------------------------------------------

type SavedPhoto = Omit<PhotoSlot, "src"> & { src: string | null };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const num = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null;

function parsePhoto(v: unknown): SavedPhoto | null {
  if (!isRecord(v)) return null;
  const src =
    v.src === null || (typeof v.src === "string" && (v.src.startsWith("/photos/") || v.src.startsWith(IDB_PREFIX)))
      ? (v.src as string | null)
      : undefined;
  const x = num(v.x, 0, 100);
  const y = num(v.y, 0, 100);
  const zoom = num(v.zoom, 1, 3);
  if (src === undefined || x === null || y === null || zoom === null) return null;
  return { src, x, y, zoom };
}

function parseText(v: unknown): CollageText | null {
  if (!isRecord(v)) return null;
  const { id, text, fontId, color, background } = v;
  const size = num(v.size, 12, 96);
  const x = num(v.x, 0, 100);
  const y = num(v.y, 0, 100);
  if (
    typeof id !== "string" ||
    typeof text !== "string" ||
    !fontOptions.some((f) => f.id === fontId) ||
    typeof color !== "string" ||
    !/^#[0-9a-f]{6}$/i.test(color) ||
    typeof background !== "boolean" ||
    size === null ||
    x === null ||
    y === null
  ) {
    return null;
  }
  return { id, text: text.slice(0, 80), fontId: fontId as CollageText["fontId"], color, size, x, y, background };
}

/** null — данные повреждены или не подходят к текущей версии шаблона. */
function parseSaved(saved: unknown, initial: CollageState): { photos: SavedPhoto[]; texts: CollageText[] } | null {
  if (!isRecord(saved) || !Array.isArray(saved.photos) || !Array.isArray(saved.texts)) return null;
  if (saved.photos.length !== initial.photos.length || saved.texts.length > 50) return null;
  const photos = saved.photos.map(parsePhoto);
  const texts = saved.texts.map(parseText);
  if (photos.some((p) => !p) || texts.some((t) => !t)) return null;
  return { photos: photos as SavedPhoto[], texts: texts as CollageText[] };
}
