"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { TRACKS } from "@/components/music/ambientMusic";
import { Equalizer, useMusic } from "@/components/music/MusicProvider";
import { TemplatePreview } from "@/components/TemplatePreview";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { getLayout, getTemplateById } from "@/data/templates";
import { skipOptimization } from "@/lib/collageState";
import { api } from "@/lib/api";
import { decodeGift, parseGift, type GiftPayload } from "@/lib/gift";

type Load = { status: "loading" } | { status: "invalid" } | { status: "ready"; gift: GiftPayload };

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

/** Страница получателя: данные подарка читаются из адреса после `#`. */
export function GiftView() {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash.slice(1), () => null);
  const [load, setLoad] = useState<Load>({ status: "loading" });

  useEffect(() => {
    if (hash === null) return;
    let cancelled = false;
    void (hash ? decodeGift(hash) : Promise.resolve(null)).then((gift) => {
      if (!cancelled) setLoad(gift ? { status: "ready", gift } : { status: "invalid" });
    });
    return () => {
      cancelled = true;
    };
  }, [hash]);

  if (load.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center bg-stone-950 text-stone-400" role="status">
        <span className="mr-3 size-6 animate-spin rounded-full border-2 border-stone-700 border-t-amber-300" /> Открываем подарок…
      </div>
    );
  }
  if (load.status === "invalid") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-stone-950 px-6 text-center text-stone-200">
        <Icon name="gift" className="size-10 text-stone-500" />
        <h1 className="font-display text-3xl">Подарок не открывается</h1>
        <p className="max-w-sm text-sm text-stone-400">Ссылка повреждена или скопирована не полностью. Попросите отправителя прислать её ещё раз.</p>
        <Link href="/" className={ui.accent}>
          На главную
        </Link>
      </div>
    );
  }
  return <Gift gift={load.gift} />;
}

/** Подарок, опубликованный из аккаунта: данные приходят с сервера по короткой ссылке /g/<id>. */
export function PublishedGift({ id }: { id: string }) {
  const [load, setLoad] = useState<Load | { status: "error"; message: string }>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    api<{ gift: Record<string, unknown> }>(`/api/gifts/${encodeURIComponent(id)}`)
      .then(({ gift }) => {
        const parsed = parseGift({ v: 1, t: gift.templateId, to: gift.to, msg: gift.message, m: gift.track, a: gift.audio, s: gift.state }, true);
        if (!cancelled) setLoad(parsed ? { status: "ready", gift: parsed } : { status: "invalid" });
      })
      .catch((e: Error & { status?: number }) => {
        if (!cancelled) setLoad(e.status === 404 ? { status: "invalid" } : { status: "error", message: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  if (load.status === "ready") return <Gift gift={load.gift} />;
  if (load.status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-stone-950 px-6 text-center text-stone-200" role="alert">
        <Icon name="alert" className="size-10 text-stone-500" />
        <h1 className="font-display text-3xl">Не удалось загрузить подарок</h1>
        <p className="max-w-sm text-sm text-stone-400">{load.message}</p>
        <button type="button" onClick={() => window.location.reload()} className={ui.accent}>Попробовать снова</button>
      </div>
    );
  }
  return <GiftState status={load.status} />;
}

function GiftState({ status }: { status: "loading" | "invalid" }) {
  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center bg-stone-950 text-stone-400" role="status">
        <span className="mr-3 size-6 animate-spin rounded-full border-2 border-stone-700 border-t-amber-300" /> Открываем подарок…
      </div>
    );
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-stone-950 px-6 text-center text-stone-200">
      <Icon name="gift" className="size-10 text-stone-500" />
      <h1 className="font-display text-3xl">Подарок не открывается</h1>
      <p className="max-w-sm text-sm text-stone-400">Ссылка повреждена, скопирована не полностью или подарок удалён. Попросите отправителя прислать её ещё раз.</p>
      <Link href="/" className={ui.accent}>На главную</Link>
    </div>
  );
}

/** Своя песня отправителя: играет только по нажатию. */
function SongButton({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const music = useMusic();
  return (
    <div className="mt-8 flex flex-col items-center gap-2">
      <audio ref={audioRef} src={src} preload="none" loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setError("Песня не загрузилась.")} />
      <button
        type="button"
        aria-pressed={playing}
        onClick={async () => {
          const audio = audioRef.current;
          if (!audio) return;
          if (playing) return audio.pause();
          if (music.playing) await music.toggle();
          try {
            setError(null);
            await audio.play();
          } catch {
            setError("Браузер не дал включить звук. Нажмите ещё раз.");
          }
        }}
        className="inline-flex min-h-12 items-center gap-3 rounded-full border border-stone-700 bg-stone-900 px-5 text-sm text-stone-100 hover:border-amber-300"
      >
        <Equalizer playing={playing} className="text-amber-300" />
        {playing ? "Пауза" : "Включить песню от отправителя"}
      </button>
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Gift({ gift }: { gift: GiftPayload }) {
  const template = getTemplateById(gift.templateId)!;
  const [stage, setStage] = useState<"closed" | "opening" | "open">("closed");
  const [viewer, setViewer] = useState<number | null>(null);
  const photos = gift.state.photos.slice(0, getLayout(gift.state.layoutId).cells.length).filter((p) => p.src);

  function open() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStage(reduce ? "open" : "opening");
    if (!reduce) setTimeout(() => setStage("open"), 900);
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-stone-950 text-stone-100">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(252,211,77,0.14),transparent)]" />
      {stage !== "open" ? (
        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-xs tracking-[0.25em] text-amber-300 uppercase">Для тебя есть сюрприз</p>
          <h1 className="mt-3 font-display text-5xl text-balance sm:text-6xl">{gift.to || "Тебе"}</h1>
          <button
            type="button"
            onClick={open}
            disabled={stage === "opening"}
            aria-label="Открыть конверт"
            className="group mt-10 [perspective:900px] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-amber-300"
          >
            <span className={`relative block h-44 w-64 rounded-xl bg-amber-100 shadow-2xl shadow-black/60 transition-transform duration-700 motion-reduce:transition-none sm:h-52 sm:w-80 ${stage === "opening" ? "translate-y-6 scale-95" : "group-hover:-translate-y-1"}`}>
              <span className="absolute inset-x-6 top-4 bottom-6 rounded-md bg-white shadow-inner transition-transform delay-300 duration-700 motion-reduce:transition-none" style={{ transform: stage === "opening" ? "translateY(-55%)" : undefined }}>
                <span className="block p-3 font-display text-sm text-stone-500 italic">с любовью…</span>
              </span>
              <span className="absolute inset-0 rounded-xl bg-amber-200 [clip-path:polygon(0_100%,50%_45%,100%_100%)]" />
              <span
                className="absolute inset-x-0 top-0 h-1/2 origin-top rounded-t-xl bg-amber-300 [clip-path:polygon(0_0,100%_0,50%_100%)] transition-transform duration-500 motion-reduce:transition-none [backface-visibility:hidden]"
                style={{ transform: stage === "opening" ? "rotateX(180deg)" : undefined }}
              />
              <span className="absolute top-1/2 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/4 items-center justify-center rounded-full bg-red-700 text-amber-100 shadow-lg">
                <Icon name="heart" className="size-5" />
              </span>
            </span>
          </button>
          <p className="mt-8 text-sm text-stone-400">{stage === "opening" ? "Открываем…" : "Нажмите на конверт"}</p>
        </main>
      ) : (
        <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pt-12 pb-24 sm:px-6">
          <Reveal>
            <p className="text-center text-xs tracking-[0.25em] text-amber-300 uppercase">Подарок</p>
            <h1 className="mt-3 text-center font-display text-5xl text-balance sm:text-6xl">{gift.to ? `${gift.to}, это тебе` : "Это тебе"}</h1>
            {gift.message && <p className="mx-auto mt-6 max-w-xl text-center text-lg leading-relaxed whitespace-pre-line text-stone-300">{gift.message}</p>}
            {gift.audio ? <SongButton src={gift.audio} /> : gift.track && <GiftMusic track={gift.track} />}
          </Reveal>
          <Reveal>
            <div className="mt-12 overflow-hidden rounded-2xl shadow-2xl ring-1 shadow-black/60 ring-stone-800">
              <TemplatePreview template={template} state={gift.state} sizes="(min-width: 896px) 896px, 100vw" eager />
            </div>
          </Reveal>
          {photos.length > 0 && (
            <Reveal>
              <h2 className="mt-14 font-display text-3xl">Фотографии</h2>
              <p className="mt-1 text-sm text-stone-400">Нажмите на снимок, чтобы открыть на весь экран.</p>
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {photos.map((p, i) => (
                  <li key={`${i}-${p.src}`}>
                    <button type="button" onClick={() => setViewer(i)} aria-label={`Открыть фото ${i + 1} из ${photos.length}`} className="relative block aspect-square w-full overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
                      <Image src={p.src} alt="" fill unoptimized={skipOptimization(p.src)} sizes="(min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-500 hover:scale-105 motion-reduce:transition-none" />
                    </button>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
          <Reveal>
            <footer className="mt-16 flex flex-col items-center gap-3 border-t border-stone-800 pt-8 text-center">
              <p className="text-sm text-stone-400">Собрано в Collage Studio</p>
              <Link href="/collages" className={ui.darkSecondary}>
                Создать свой коллаж
              </Link>
            </footer>
          </Reveal>
        </main>
      )}
      {viewer !== null && <Lightbox photos={photos.map((p) => p.src)} index={viewer} onChange={setViewer} onClose={() => setViewer(null)} />}
    </div>
  );
}

function GiftMusic({ track }: { track: NonNullable<GiftPayload["track"]> }) {
  const music = useMusic();
  const info = TRACKS.find((t) => t.id === track)!;
  const playingThis = music.playing && music.track.id === track;
  return (
    <div className="mt-8 flex justify-center">
      <button
        type="button"
        onClick={() => (playingThis ? music.toggle() : music.playTrack(track))}
        aria-pressed={playingThis}
        className="inline-flex min-h-12 items-center gap-3 rounded-full border border-stone-700 bg-stone-900 px-5 text-sm text-stone-100 hover:border-amber-300"
      >
        <Equalizer playing={playingThis} className="text-amber-300" />
        {playingThis ? "Остановить музыку" : `Включить музыку · ${info.title}`}
      </button>
      {music.error && <p role="alert" className="mt-2 text-xs text-red-400">{music.error}</p>}
    </div>
  );
}

/** Плавное появление секции при прокрутке; без анимации при prefers-reduced-motion. */
function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setShown(true), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-[opacity,translate] duration-700 motion-reduce:transition-none ${shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"}`}>
      {children}
    </div>
  );
}

function Lightbox({ photos, index, onChange, onClose }: { photos: string[]; index: number; onChange: (i: number) => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const startX = useRef<number | null>(null);
  const go = (step: number) => onChange((index + step + photos.length) % photos.length);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Фото ${index + 1} из ${photos.length}`}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black"
    >
      <div
        className="relative flex h-full touch-pan-y items-center justify-center"
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        <div className="relative h-[80dvh] w-full">
          <Image key={photos[index]} src={photos[index]} alt={`Фото ${index + 1}`} fill unoptimized={skipOptimization(photos[index])} sizes="100vw" className="animate-reappear object-contain" />
        </div>
        <p className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 text-sm text-stone-300 tabular-nums">
          {index + 1} / {photos.length}
        </p>
        <button type="button" autoFocus onClick={onClose} aria-label="Закрыть" className="absolute top-[max(0.5rem,env(safe-area-inset-top))] right-2 inline-flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
          <Icon name="close" />
        </button>
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Предыдущее фото" className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 inline-flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2">
              <Icon name="left" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Следующее фото" className="absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] inline-flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2">
              <Icon name="right" />
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
