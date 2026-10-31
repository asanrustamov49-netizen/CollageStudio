import {
  aspectOptions,
  fontOptions,
  layouts,
  TEXT_MAX_LENGTH,
} from "@/data/templates";
import type {
  CollageState,
  CollageStyle,
  CollageText,
  PhotoSlot,
} from "@/types/collage";

export const IDB_PREFIX = "idb:";

export const UPLOAD_SRC_RE = /^\/api\/uploads\/[\w-]{16,32}$/;

export function isOwnPhoto(src: string) {
  return src.startsWith("blob:") || UPLOAD_SRC_RE.test(src);
}

export function skipOptimization(src: string) {
  return src.startsWith("blob:") || src.startsWith("/api/uploads/");
}

export function isUserPhoto(src: string) {
  return src.startsWith("blob:");
}

export type SavedPhoto = Omit<PhotoSlot, "src"> & { src: string | null };
type ParsedState = Omit<CollageState, "photos"> & { photos: SavedPhoto[] };

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const num = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(max, Math.max(min, v))
    : null;
const isColor = (v: unknown): v is string =>
  typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);

function parsePhoto(v: unknown): SavedPhoto | null {
  if (!isRecord(v)) return null;
  const src =
    v.src === null ||
    v.src === "" ||
    (typeof v.src === "string" &&
      (v.src.startsWith("/photos/") ||
        v.src.startsWith(IDB_PREFIX) ||
        UPLOAD_SRC_RE.test(v.src)))
      ? (v.src as string | null)
      : undefined;
  const x = num(v.x, 0, 100);
  const y = num(v.y, 0, 100);
  const zoom = num(v.zoom, 1, 3);
  if (src === undefined || x === null || y === null || zoom === null)
    return null;
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
    !isColor(color) ||
    typeof background !== "boolean" ||
    size === null ||
    x === null ||
    y === null
  ) {
    return null;
  }
  return {
    id,
    text: text.slice(0, TEXT_MAX_LENGTH),
    fontId: fontId as CollageText["fontId"],
    color,
    size,
    bold: v.bold === true,
    x,
    y,
    background,
  };
}

function parseStyle(v: unknown, fallback: CollageStyle): CollageStyle {
  if (!isRecord(v)) return fallback;
  return {
    background: isColor(v.background) ? v.background : fallback.background,
    gap: num(v.gap, 0, 32) ?? fallback.gap,
    radius: num(v.radius, 0, 40) ?? fallback.radius,
    aspect: aspectOptions.some((a) => a.id === v.aspect)
      ? (v.aspect as CollageStyle["aspect"])
      : fallback.aspect,
  };
}

export function parseState(
  saved: unknown,
  initial: CollageState,
): ParsedState | null {
  if (
    !isRecord(saved) ||
    !Array.isArray(saved.photos) ||
    !Array.isArray(saved.texts)
  )
    return null;
  if (saved.photos.length > 24 || saved.texts.length > 30) return null;
  const photos = saved.photos.map(parsePhoto);
  const texts = saved.texts.map(parseText);
  if (photos.some((p) => !p) || texts.some((t) => !t)) return null;
  const layoutId = layouts.some((l) => l.id === saved.layoutId)
    ? (saved.layoutId as CollageState["layoutId"])
    : initial.layoutId;
  return {
    layoutId,
    photos: photos as SavedPhoto[],
    texts: texts as CollageText[],
    style: parseStyle(saved.style, initial.style),
  };
}
