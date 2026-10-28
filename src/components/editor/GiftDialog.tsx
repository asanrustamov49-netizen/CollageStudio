"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useState } from "react";
import { TRACKS, type TrackId } from "@/components/music/ambientMusic";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { emptySlot } from "@/data/templates";
import { api, uploadFile } from "@/lib/api";
import { encodeGift, GIFT_MESSAGE_MAX, GIFT_TO_MAX, giftPath, publishedGiftPath, serializeGift, toGuestGiftState } from "@/lib/gift";
import { useAccount } from "@/store/account";
import type { CollageState, CollageTemplate } from "@/types/collage";
import { Modal } from "./Modal";

/** Предел длины ссылки, при котором QR-код ещё уверенно читается камерой телефона. */
const MAX_QR_URL = 1800;
const MAX_SONG_BYTES = 12 * 1024 * 1024;

type Music = TrackId | "" | "own";

interface GiftDialogProps {
  template: CollageTemplate;
  state: CollageState;
  onClose: () => void;
  notify: (message: string, kind?: "success" | "error") => void;
}

export function GiftDialog({ template, state, onClose, notify }: GiftDialogProps) {
  const account = useAccount();
  const signedIn = account.status === "user";
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [music, setMusic] = useState<Music>("dawn");
  const [song, setSong] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);
  const [result, setResult] = useState<{ url: string; qr: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { replaced } = toGuestGiftState(state, template);
  const toError = touched && !to.trim() ? "Укажите имя получателя." : null;
  const songError = touched && music === "own" && !song ? "Выберите файл песни." : null;
  const isLocal = typeof window !== "undefined" && /^(localhost|127\.|\[::1\])/.test(window.location.hostname);

  function pickSong(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("audio/")) return setError("Это не аудиофайл. Подойдут MP3, M4A, OGG, WAV.");
    if (file.size > MAX_SONG_BYTES) return setError("Песня больше 12 МБ.");
    setError(null);
    setSong(file);
  }

  async function create() {
    setTouched(true);
    if (!to.trim() || (music === "own" && !song)) return;
    setBusy(true);
    setError(null);
    try {
      let url: string;
      const base = { templateId: template.id, to: to.trim(), message: message.trim(), track: music && music !== "own" ? music : null };
      if (signedIn) {
        // Фото, которые не успели загрузиться в аккаунт, заменяются фото шаблона.
        const giftState = { ...state, photos: state.photos.map((p, i) => (p.src.startsWith("blob:") ? { ...emptySlot, src: template.photos[i] ?? "" } : p)) };
        const audio = music === "own" && song ? await uploadFile(song, song.name) : null;
        const { id } = await api<{ id: string }>("/api/gifts", { method: "POST", body: JSON.stringify(serializeGift({ ...base, audio, state: giftState })) });
        url = `${window.location.origin}${publishedGiftPath(id)}`;
      } else {
        url = `${window.location.origin}${giftPath(await encodeGift({ ...base, state: toGuestGiftState(state, template).state }))}`;
        if (url.length > MAX_QR_URL) {
          setError("Слишком много данных для QR-кода. Сократите сообщение или тексты коллажа.");
          return;
        }
      }
      const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 4, width: 640, color: { dark: "#000000", light: "#ffffff" } });
      setResult({ url, qr });
      notify("Подарок создан");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать подарок. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
    } catch {
      setError("Браузер не дал скопировать — выделите ссылку вручную.");
    }
  }

  async function share() {
    if (!result) return;
    try {
      await navigator.share({ title: `Подарок для ${to.trim()}`, url: result.url });
    } catch {
      // Пользователь закрыл окно «Поделиться» — это не ошибка.
    }
  }

  return (
    <Modal
      title={result ? "Подарок готов" : "Подарок с QR-кодом"}
      onClose={onClose}
      footer={
        result ? (
          <>
            <button type="button" className={ui.secondary} onClick={() => setResult(null)}>
              Изменить
            </button>
            <a href={result.url} target="_blank" rel="noreferrer" className={ui.accent}>
              <Icon name="eye" className="size-4" /> Открыть подарок
            </a>
          </>
        ) : (
          <>
            <button type="button" className={ui.secondary} onClick={onClose}>
              Отмена
            </button>
            <button type="button" className={ui.accent} onClick={create} disabled={busy}>
              <Icon name="gift" className="size-4" /> {busy ? "Создаём…" : "Создать ссылку и QR"}
            </button>
          </>
        )
      }
    >
      {error && (
        <p role="alert" className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <Icon name="alert" className="size-4" /> {error}
        </p>
      )}
      {result ? (
        <div className="space-y-4">
          <div className="mx-auto w-56 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR как data URL */}
            <img src={result.qr} alt={`QR-код подарка для ${to.trim()}`} className="block w-full [image-rendering:pixelated]" />
          </div>
          <div className="flex gap-2">
            <input readOnly value={result.url} onFocus={(e) => e.target.select()} aria-label="Ссылка на подарок" className={`${ui.field} mt-0 min-w-0 flex-1 font-mono text-xs`} />
            <button type="button" onClick={copy} className={`${ui.secondary} w-11 shrink-0 px-0`} aria-label={copied ? "Скопировано" : "Скопировать ссылку"}>
              <Icon name={copied ? "check" : "copy"} className="size-4" />
            </button>
          </div>
          {copied && <p role="status" className="text-center text-xs text-emerald-700">Ссылка скопирована</p>}
          <div className="grid grid-cols-2 gap-2">
            <a href={result.qr} download={`podarok-${template.id}-qr.png`} className={ui.secondary}>
              <Icon name="download" className="size-4" /> QR (PNG)
            </a>
            {typeof navigator !== "undefined" && "share" in navigator ? (
              <button type="button" onClick={share} className={ui.secondary}>
                <Icon name="upload" className="size-4" /> Поделиться
              </button>
            ) : (
              <Link href="/account" className={ui.secondary}>Мои подарки</Link>
            )}
          </div>
          {signedIn && <p className="text-xs text-stone-500">Подарок сохранён в аккаунте: его можно снова открыть или удалить в разделе «Аккаунт».</p>}
          {isLocal && (
            <p className="rounded-xl bg-amber-100 p-3 text-xs text-amber-900">
              Сайт открыт на localhost: ссылка и QR сработают на другом устройстве, только когда проект будет опубликован или открыт по адресу компьютера в локальной сети.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-stone-600">Получатель откроет страницу с конвертом, вашим сообщением, коллажем и музыкой — без регистрации.</p>
          <label className="block">
            <span className={ui.label}>Имя получателя</span>
            <input value={to} maxLength={GIFT_TO_MAX} placeholder="Например, Алина" aria-invalid={Boolean(toError)} onChange={(e) => setTo(e.target.value)} onBlur={() => setTouched(true)} className={ui.field} />
            {toError && <span className="mt-1 block text-xs text-red-700">{toError}</span>}
          </label>
          <label className="block">
            <span className="flex justify-between">
              <span className={ui.label}>Сообщение</span>
              <span className="text-xs text-stone-500 tabular-nums">
                {message.length}/{GIFT_MESSAGE_MAX}
              </span>
            </span>
            <textarea value={message} rows={4} maxLength={GIFT_MESSAGE_MAX} placeholder="Пара тёплых слов" onChange={(e) => setMessage(e.target.value)} className={`${ui.field} resize-none`} />
          </label>
          <label className="block">
            <span className={ui.label}>Музыка на странице</span>
            <select value={music} onChange={(e) => setMusic(e.target.value as Music)} className={ui.field}>
              <option value="">Без музыки</option>
              {TRACKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} — {t.mood.toLowerCase()}
                </option>
              ))}
              <option value="own" disabled={!signedIn}>
                Своя песня{signedIn ? "" : " (нужен аккаунт)"}
              </option>
            </select>
          </label>
          {music === "own" && signedIn && (
            <label className="block">
              <span className={ui.label}>Файл песни</span>
              <input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,audio/wav,audio/*" onChange={(e) => pickSong(e.target.files?.[0])} className={`${ui.field} file:mr-3 file:rounded-lg file:border-0 file:bg-stone-200 file:px-3 file:py-1.5`} />
              <span className={`mt-1 block text-xs ${songError ? "text-red-700" : "text-stone-500"}`}>{songError ?? (song ? `${song.name} · ${(song.size / 1024 / 1024).toFixed(1)} МБ` : "MP3, M4A, OGG или WAV до 12 МБ. Загружайте только музыку, на которую у вас есть права.")}</span>
            </label>
          )}
          {signedIn ? (
            <p className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900">
              <Icon name="check" className="size-4" /> Вы вошли: в подарок попадут ваши фото, а ссылка будет короткой.
            </p>
          ) : (
            replaced > 0 && (
              <p className="flex gap-2 rounded-xl bg-amber-100 p-3 text-xs text-amber-900">
                <Icon name="alert" className="size-4" />
                <span>
                  Своих фото в проекте: {replaced}. Без аккаунта их негде хранить, поэтому в подарке на их месте будут фото шаблона.{" "}
                  <Link href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/projects")}`} className="font-medium underline">
                    Войдите
                  </Link>
                  , чтобы подарить свои фото и песню.
                </span>
              </p>
            )
          )}
        </div>
      )}
    </Modal>
  );
}
