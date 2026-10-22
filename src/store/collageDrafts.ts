import { useSyncExternalStore } from "react";
import type { CollageText } from "@/types/collage";

/** Правки шаблона, сделанные в редакторе. Живут в памяти вкладки. */
export interface CollageDraft {
  /** Object URL загруженных фото по индексу ячейки. */
  photos: Record<number, string>;
  texts?: CollageText[];
}

let drafts: Record<string, CollageDraft> = {};
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function updateDraft(id: string, patch: Partial<CollageDraft>) {
  drafts = { ...drafts, [id]: { ...(drafts[id] ?? { photos: {} }), ...patch } };
  listeners.forEach((listener) => listener());
}

export function useCollageDraft(id: string): CollageDraft | undefined {
  return useSyncExternalStore(
    subscribe,
    () => drafts[id],
    () => undefined,
  );
}

export function setDraftPhoto(id: string, index: number, file: File) {
  const photos = drafts[id]?.photos ?? {};
  if (photos[index]) URL.revokeObjectURL(photos[index]);
  updateDraft(id, { photos: { ...photos, [index]: URL.createObjectURL(file) } });
}

export function setDraftTexts(id: string, texts: CollageText[]) {
  updateDraft(id, { texts });
}
