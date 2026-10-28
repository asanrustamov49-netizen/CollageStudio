import { TRACKS, type TrackId } from "@/components/music/ambientMusic";
import { emptySlot, getInitialState, getTemplateById } from "@/data/templates";
import { isOwnPhoto, parseState, UPLOAD_SRC_RE } from "@/lib/collageState";
import type { CollageState, CollageTemplate } from "@/types/collage";

/**
 * Подарок бывает двух видов:
 * - опубликованный в аккаунте (`/g/<id>`): хранится на сервере, может содержать свои фото и свою песню;
 * - гостевой (`/gift#…`): целиком лежит в адресе после `#`, сервер его не видит.
 *   Свои фото в такую ссылку не помещаются — на их месте остаются фото шаблона.
 */
export interface GiftPayload {
  templateId: string;
  to: string;
  message: string;
  track: TrackId | null;
  /** Своя песня: адрес файла в аккаунте (/api/uploads/<id>). */
  audio: string | null;
  state: CollageState;
}

export const GIFT_TO_MAX = 40;
export const GIFT_MESSAGE_MAX = 400;

/** Для гостевой ссылки: свои фото заменяются фото шаблона из той же ячейки. */
export function toGuestGiftState(state: CollageState, template: CollageTemplate): { state: CollageState; replaced: number } {
  let replaced = 0;
  const photos = state.photos.map((p, i) => {
    if (!isOwnPhoto(p.src)) return p;
    replaced++;
    const fallback = template.photos[i];
    return fallback ? { ...emptySlot, src: fallback } : { ...emptySlot };
  });
  return { state: { ...state, photos }, replaced };
}

/** Сериализованный вид подарка: короткие ключи, чтобы ссылка и QR были компактнее. */
export function serializeGift(gift: Omit<GiftPayload, "audio"> & { audio?: string | null }) {
  return { v: 1, t: gift.templateId, to: gift.to, msg: gift.message, m: gift.track, s: gift.state, a: gift.audio ?? null };
}

/**
 * Проверяет подарок из ссылки или из запроса к серверу.
 * `allowUploads` — разрешить фото и песню из аккаунта (только для опубликованных подарков).
 */
export function parseGift(raw: unknown, allowUploads: boolean): GiftPayload | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const template = typeof r.t === "string" ? getTemplateById(r.t) : undefined;
  if (!template || r.v !== 1) return null;
  const parsed = parseState(r.s, getInitialState(template));
  if (!parsed) return null;
  const okSrc = (src: string | null) => !src || src.startsWith("/photos/") || (allowUploads && UPLOAD_SRC_RE.test(src));
  if (!parsed.photos.every((p) => okSrc(p.src))) return null;
  const audio = typeof r.a === "string" && allowUploads && UPLOAD_SRC_RE.test(r.a) ? r.a : null;
  return {
    templateId: template.id,
    to: typeof r.to === "string" ? r.to.trim().slice(0, GIFT_TO_MAX) : "",
    message: typeof r.msg === "string" ? r.msg.trim().slice(0, GIFT_MESSAGE_MAX) : "",
    track: TRACKS.some((t) => t.id === r.m) ? (r.m as TrackId) : null,
    audio,
    state: { ...parsed, photos: parsed.photos.map((p) => ({ ...p, src: p.src ?? "" })) },
  };
}

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (text: string) => {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const body = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(body).arrayBuffer());
}

type GuestGift = Omit<GiftPayload, "audio">;

/** Синхронная версия без сжатия — для готовых примеров на сервере. */
export function encodeGiftPlain(gift: GuestGift): string {
  return `j.${toBase64Url(new TextEncoder().encode(JSON.stringify(serializeGift(gift))))}`;
}

/** Сжимает данные, если браузер поддерживает CompressionStream: так QR-код получается проще. */
export async function encodeGift(gift: GuestGift): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(serializeGift(gift)));
  if (typeof CompressionStream === "undefined") return `j.${toBase64Url(bytes)}`;
  return `z.${toBase64Url(await pipe(bytes, new CompressionStream("deflate-raw")))}`;
}

/** null — ссылка повреждена или создана для неизвестного шаблона. */
export async function decodeGift(encoded: string): Promise<GiftPayload | null> {
  try {
    const [kind, data] = [encoded.slice(0, 2), encoded.slice(2)];
    let bytes = fromBase64Url(data);
    if (kind === "z.") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    else if (kind !== "j.") return null;
    return parseGift(JSON.parse(new TextDecoder().decode(bytes)), false);
  } catch {
    return null;
  }
}

export function giftPath(encoded: string) {
  return `/gift#${encoded}`;
}

export function publishedGiftPath(id: string) {
  return `/g/${id}`;
}
