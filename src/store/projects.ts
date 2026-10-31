import { useEffect, useSyncExternalStore } from "react";
import { emptySlot, getInitialState, getTemplateById } from "@/data/templates";
import type { CollageState, PhotoSlot } from "@/types/collage";
import {
  IDB_PREFIX,
  isRecord,
  isUserPhoto,
  parseState,
} from "@/lib/collageState";
import { api, uploadFile } from "@/lib/api";
import { deletePhotosExcept, getPhoto, putPhoto } from "./photoStorage";

export { isUserPhoto };

export interface ProjectMeta {
  id: string;
  templateId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  synced?: boolean;
}

export interface ProjectHistory {
  past: CollageState[];
  present: CollageState;
  future: CollageState[];
  mergeKey?: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "partial" | "error";

const HISTORY_LIMIT = 50;
const INDEX_KEY = "collage-studio:projects:v2";
const PROJECT_PREFIX = "collage-studio:project:v2:";
const LEGACY_PREFIX = "collage-studio:draft:v1:";

let index: ProjectMeta[] | null = null;
let histories: Record<string, ProjectHistory> = {};
let statuses: Record<string, SaveStatus> = {};
let syncEnabled = false;

export function setProjectSync(enabled: boolean) {
  syncEnabled = enabled;
}

export function isProjectSyncEnabled() {
  return syncEnabled;
}
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function loadIndex(): ProjectMeta[] {
  if (index) return index;
  const saved = readJson(INDEX_KEY);
  index = Array.isArray(saved) ? saved.filter(isMeta) : [];
  migrateLegacy();
  return index;
}

function isMeta(v: unknown): v is ProjectMeta {
  return (
    isRecord(v) &&
    typeof v.id === "string" &&
    typeof v.templateId === "string" &&
    typeof v.name === "string" &&
    typeof v.createdAt === "number" &&
    typeof v.updatedAt === "number" &&
    Boolean(getTemplateById(v.templateId))
  );
}

function saveIndex() {
  if (index) writeJson(INDEX_KEY, index);
}

function setIndex(next: ProjectMeta[]) {
  index = next;
  saveIndex();
  emit();
}

function migrateLegacy() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LEGACY_PREFIX)) keys.push(key);
    }
    for (const key of keys) {
      const templateId = key.slice(LEGACY_PREFIX.length);
      const template = getTemplateById(templateId);
      const saved = readJson(key);
      removeKey(key);
      if (!template || !isRecord(saved)) continue;
      const id = newId();
      const now = Date.now();
      writeJson(PROJECT_PREFIX + id, {
        ...getInitialState(template),
        ...saved,
        layoutId: template.layout,
      });
      index!.push({
        id,
        templateId,
        name: template.title,
        createdAt: now,
        updatedAt: now,
      });
    }
    if (keys.length) saveIndex();
  } catch {}
}

function newId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function useProjects(): ProjectMeta[] | null {
  return useSyncExternalStore(subscribe, loadIndex, () => null);
}

export function getProjectMeta(id: string): ProjectMeta | undefined {
  return loadIndex().find((p) => p.id === id);
}

export function createProject(templateId: string): string | null {
  const template = getTemplateById(templateId);
  if (!template) return null;
  const id = newId();
  const now = Date.now();
  const state = getInitialState(template);
  histories = { ...histories, [id]: { past: [], present: state, future: [] } };
  const ok = writeJson(PROJECT_PREFIX + id, state);
  setIndex([
    { id, templateId, name: template.title, createdAt: now, updatedAt: now },
    ...loadIndex(),
  ]);
  statuses = { ...statuses, [id]: ok ? "saved" : "error" };
  emit();
  if (syncEnabled) schedulePersist(id);
  return id;
}

export function renameProject(id: string, name: string) {
  const trimmed = name.trim().slice(0, 60);
  if (!trimmed) return;
  setIndex(
    loadIndex().map((p) =>
      p.id === id ? { ...p, name: trimmed, updatedAt: Date.now() } : p,
    ),
  );
  void restoreProject(id).then(() => schedulePersist(id));
}

export function deleteProject(id: string) {
  removeKey(PROJECT_PREFIX + id);
  const { [id]: _removed, ...rest } = histories;
  void _removed;
  histories = rest;
  clearTimeout(timers.get(id));
  timers.delete(id);
  statuses = { ...statuses, [id]: "idle" };
  setIndex(loadIndex().filter((p) => p.id !== id));
  if (syncEnabled)
    void api(`/api/projects/${id}`, { method: "DELETE" }).catch(
      () => undefined,
    );
}

export async function duplicateProject(id: string): Promise<string | null> {
  const meta = getProjectMeta(id);
  if (!meta) return null;
  await restoreProject(id);
  const source = histories[id]?.present;
  if (!source) return null;
  const copyId = newId();
  const now = Date.now();
  histories = {
    ...histories,
    [copyId]: { past: [], present: source, future: [] },
  };
  setIndex([
    {
      ...meta,
      id: copyId,
      name: `${meta.name} (копия)`,
      createdAt: now,
      updatedAt: now,
    },
    ...loadIndex(),
  ]);
  persist(copyId);
  return copyId;
}

export type ProjectLoad =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; meta: ProjectMeta; history: ProjectHistory };

let loadCache: Record<string, ProjectLoad> = {};
const missing = new Set<string>();
const serverLoad: ProjectLoad = { status: "loading" };

function snapshot(id: string): ProjectLoad {
  const meta = index ? index.find((p) => p.id === id) : undefined;
  const history = histories[id];
  const next: ProjectLoad =
    meta && history
      ? { status: "ready", meta, history }
      : missing.has(id) || (index && !meta)
        ? { status: "missing" }
        : { status: "loading" };
  const prev = loadCache[id];
  if (
    prev &&
    prev.status === next.status &&
    (next.status !== "ready" ||
      (prev.status === "ready" &&
        prev.meta === next.meta &&
        prev.history === next.history))
  ) {
    return prev;
  }
  loadCache = { ...loadCache, [id]: next };
  return next;
}

export function useProject(id: string): ProjectLoad {
  useEffect(() => {
    loadIndex();
    void restoreProject(id);
  }, [id]);
  return useSyncExternalStore(
    subscribe,
    () => snapshot(id),
    () => serverLoad,
  );
}

export function useProjectState(id: string): CollageState | undefined {
  useEffect(() => {
    void restoreProject(id);
  }, [id]);
  return useSyncExternalStore(
    subscribe,
    () => histories[id]?.present,
    () => undefined,
  );
}

function setHistory(id: string, history: ProjectHistory) {
  histories = { ...histories, [id]: history };
  const now = Date.now();
  index = loadIndex().map((p) => (p.id === id ? { ...p, updatedAt: now } : p));
  statuses = { ...statuses, [id]: "saving" };
  emit();
  schedulePersist(id);
}

export function commitProject(
  id: string,
  update: (current: CollageState) => CollageState,
  mergeKey?: string,
) {
  const history = histories[id];
  if (!history) return;
  const next = update(history.present);
  if (next === history.present) return;
  if (mergeKey && history.mergeKey === mergeKey) {
    setHistory(id, { ...history, present: next, future: [] });
    return;
  }
  setHistory(id, {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
    mergeKey,
  });
}

export function undoProject(id: string) {
  const h = histories[id];
  if (!h?.past.length) return;
  setHistory(id, {
    past: h.past.slice(0, -1),
    present: h.past[h.past.length - 1],
    future: [h.present, ...h.future],
  });
}

export function redoProject(id: string) {
  const h = histories[id];
  if (!h?.future.length) return;
  setHistory(id, {
    past: [...h.past, h.present],
    present: h.future[0],
    future: h.future.slice(1),
  });
}

export function endMerge(id: string) {
  if (histories[id]?.mergeKey)
    histories[id] = { ...histories[id], mergeKey: undefined };
}

export function useSaveStatus(id: string): SaveStatus {
  return useSyncExternalStore(
    subscribe,
    () => statuses[id] ?? "idle",
    () => "idle",
  );
}

export function hasUnsavedChanges(): boolean {
  return Object.values(statuses).some(
    (s) => s === "saving" || s === "error" || s === "partial",
  );
}

const photoKeys = new Map<string, string>();
let cleanup: Promise<void> | null = null;

export async function registerPhoto(
  file: Blob,
): Promise<{ url: string; persisted: boolean }> {
  if (syncEnabled) {
    try {
      return { url: await uploadFile(file, "photo"), persisted: true };
    } catch {}
  }
  const url = URL.createObjectURL(file);
  const key = `photo-${newId()}`;
  try {
    await cleanup;
    await putPhoto(key, file);
    photoKeys.set(url, key);
    return { url, persisted: true };
  } catch {
    return { url, persisted: false };
  }
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

function schedulePersist(id: string) {
  if (typeof window === "undefined") return;
  clearTimeout(timers.get(id));
  timers.set(
    id,
    setTimeout(() => persist(id), 400),
  );
}

function persist(id: string) {
  timers.delete(id);
  const history = histories[id];
  if (!history || !loadIndex().some((p) => p.id === id)) return;
  let lost = false;
  const photos = history.present.photos.map((p) => {
    if (!isUserPhoto(p.src)) return p;
    const key = photoKeys.get(p.src);
    if (!key) lost = true;
    return { ...p, src: key ? IDB_PREFIX + key : null };
  });
  const ok =
    writeJson(PROJECT_PREFIX + id, { ...history.present, photos }) &&
    writeJson(INDEX_KEY, index);
  if (syncEnabled && ok) {
    void pushProject(id);
    return;
  }
  statuses = { ...statuses, [id]: !ok ? "error" : lost ? "partial" : "saved" };
  emit();
}

async function pushProject(id: string) {
  const history = histories[id];
  const meta = loadIndex().find((p) => p.id === id);
  if (!history || !meta) return;
  try {
    let changed = false;
    const photos = await Promise.all(
      history.present.photos.map(async (p) => {
        if (!isUserPhoto(p.src)) return p;
        changed = true;
        return {
          ...p,
          src: await uploadFile(await (await fetch(p.src)).blob(), "photo"),
        };
      }),
    );
    const present = changed ? { ...history.present, photos } : history.present;
    if (changed && histories[id]?.present === history.present) {
      histories = { ...histories, [id]: { ...histories[id], present } };
      writeJson(PROJECT_PREFIX + id, present);
    }
    await api(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        templateId: meta.templateId,
        name: meta.name,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt,
        state: present,
      }),
    });
    index = loadIndex().map((p) => (p.id === id ? { ...p, synced: true } : p));
    saveIndex();
    if (!timers.has(id)) statuses = { ...statuses, [id]: "saved" };
  } catch {
    statuses = { ...statuses, [id]: "error" };
  }
  emit();
}

export function retrySave(id: string) {
  persist(id);
}

function cleanupPhotos() {
  cleanup ??= (async () => {
    const keep = new Set<string>();
    try {
      for (const meta of loadIndex()) {
        const saved = readJson(PROJECT_PREFIX + meta.id) as {
          photos?: { src?: unknown }[];
        } | null;
        for (const p of saved?.photos ?? []) {
          if (typeof p?.src === "string" && p.src.startsWith(IDB_PREFIX))
            keep.add(p.src.slice(IDB_PREFIX.length));
        }
      }
      await deletePhotosExcept(keep);
    } catch {}
  })();
  return cleanup;
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () =>
    [...timers.keys()].forEach(persist),
  );
  window.addEventListener("beforeunload", (e) => {
    if (hasUnsavedChanges()) e.preventDefault();
  });
  void cleanupPhotos();
}

const restoring = new Map<string, Promise<void>>();

function restoreProject(id: string): Promise<void> {
  if (histories[id] || missing.has(id)) return Promise.resolve();
  const existing = restoring.get(id);
  if (existing) return existing;
  const task = (async () => {
    const meta = loadIndex().find((p) => p.id === id);
    const template = meta && getTemplateById(meta.templateId);
    if (!meta || !template) {
      missing.add(id);
      emit();
      return;
    }
    const initial = getInitialState(template);
    const parsed = parseState(readJson(PROJECT_PREFIX + id), initial);
    await cleanupPhotos();
    const photos = parsed
      ? await Promise.all(
          parsed.photos.map(async (p): Promise<PhotoSlot> => {
            if (p.src === null) return { ...p, src: "" };
            if (!p.src.startsWith(IDB_PREFIX)) return { ...p, src: p.src };
            const key = p.src.slice(IDB_PREFIX.length);
            const blob = await getPhoto(key).catch(() => undefined);
            if (!blob) return { ...emptySlot };
            const url = URL.createObjectURL(blob);
            photoKeys.set(url, key);
            return { ...p, src: url };
          }),
        )
      : null;
    if (histories[id]) return;
    histories = {
      ...histories,
      [id]: {
        past: [],
        present: parsed && photos ? { ...parsed, photos } : initial,
        future: [],
      },
    };
    statuses = { ...statuses, [id]: parsed ? "saved" : "saving" };
    if (!parsed) schedulePersist(id);
    emit();
  })();
  restoring.set(id, task);
  return task;
}

interface RemoteProject extends ProjectMeta {
  state: CollageState;
}

export async function syncWithServer() {
  const { projects: remote } = await api<{ projects: RemoteProject[] }>(
    "/api/projects",
  );
  const byId = new Map(remote.map((r) => [r.id, r]));
  const toPush: string[] = [];
  let next: ProjectMeta[] = [];
  for (const local of loadIndex()) {
    const r = byId.get(local.id);
    if (!r) {
      if (local.synced) removeKey(PROJECT_PREFIX + local.id);
      else {
        next.push(local);
        toPush.push(local.id);
      }
    } else if (local.updatedAt > r.updatedAt) {
      next.push(local);
      toPush.push(local.id);
    } else next.push(local);
  }
  for (const r of remote) {
    if (!getTemplateById(r.templateId)) continue;
    const local = next.find((p) => p.id === r.id);
    if (local && local.updatedAt >= r.updatedAt) continue;
    const meta: ProjectMeta = {
      id: r.id,
      templateId: r.templateId,
      name: r.name,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      synced: true,
    };
    writeJson(PROJECT_PREFIX + r.id, r.state);
    next = local
      ? next.map((p) => (p.id === r.id ? meta : p))
      : [...next, meta];
    if (statuses[r.id] !== "saving")
      histories = {
        ...histories,
        [r.id]: { past: [], present: r.state, future: [] },
      };
  }
  setIndex(next);
  for (const id of toPush) {
    await restoreProject(id);
    await pushProject(id);
  }
}

export function clearLocalProjects() {
  for (const p of loadIndex()) removeKey(PROJECT_PREFIX + p.id);
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  histories = {};
  statuses = {};
  loadCache = {};
  missing.clear();
  restoring.clear();
  setIndex([]);
  void deletePhotosExcept(new Set()).catch(() => undefined);
}
