import { useSyncExternalStore } from "react";
import { getTemplateById } from "@/data/templates";
import { api } from "@/lib/api";

const KEY = "collage-studio:favorites:v1";

let favorites: string[] | null = null;
let syncEnabled = false;
const listeners = new Set<() => void>();

const valid = (ids: unknown): string[] =>
  Array.isArray(ids)
    ? [
        ...new Set(
          ids.filter(
            (id): id is string =>
              typeof id === "string" && Boolean(getTemplateById(id)),
          ),
        ),
      ]
    : [];

function load(): string[] {
  if (favorites) return favorites;
  try {
    favorites = valid(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
  } catch {
    favorites = [];
  }
  return favorites;
}

function set(next: string[]) {
  favorites = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFavorites(): string[] | null {
  return useSyncExternalStore(subscribe, load, () => null);
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const current = load();
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id];
  set(next);
  if (!syncEnabled) return true;
  try {
    await api("/api/favorites", {
      method: "PUT",
      body: JSON.stringify({ ids: next }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function syncFavorites() {
  syncEnabled = true;
  const { ids } = await api<{ ids: string[] }>("/api/favorites");
  const merged = valid([...ids, ...load()]);
  set(merged);
  if (merged.length !== ids.length)
    await api("/api/favorites", {
      method: "PUT",
      body: JSON.stringify({ ids: merged }),
    });
}

export function clearLocalFavorites() {
  syncEnabled = false;
  set([]);
}
