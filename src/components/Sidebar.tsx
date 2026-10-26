"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TRACKS } from "@/components/music/ambientMusic";
import { Equalizer, useMusic } from "@/components/music/MusicProvider";
import { categories, getCategoryHref, getTemplatesByCategory } from "@/data/templates";
import type { CategorySlug } from "@/types/collage";

const icons: Record<CategorySlug, string> = {
  all: "✨",
  nature: "🌿",
  friends: "🤝",
  wedding: "💍",
  travel: "✈️",
  birthday: "🎂",
  memories: "📸",
};

/** Боковая панель каталога: темы и мини-плеер. На телефоне выезжает по кнопке меню. */
export function Sidebar({ active }: { active: CategorySlug }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-800 bg-stone-950/90 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/" className="font-display text-xl text-stone-100 italic">
          Collage Studio
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="sidebar"
          aria-label="Открыть меню"
          className="flex size-10 items-center justify-center rounded-full border border-stone-700 text-stone-200"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 6h14M3 10h14M3 14h14" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto border-r border-stone-800 bg-stone-900 transition-transform duration-300 md:sticky md:top-0 md:h-screen md:shrink-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between px-6 pt-7 pb-6">
          <Link href="/" className="group">
            <span className="block font-display text-2xl text-stone-100 italic">Collage Studio</span>
            <span className="mt-1 block text-xs text-stone-500 group-hover:text-stone-400">← на главную</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
            className="-mr-2 flex size-9 items-center justify-center rounded-full text-stone-400 hover:bg-stone-800 md:hidden"
          >
            ✕
          </button>
        </div>

        <nav aria-label="Категории" className="px-3">
          <p className="px-3 pb-2 text-[11px] tracking-[0.2em] text-stone-500 uppercase">Темы</p>
          <ul className="space-y-1">
            {categories.map((c) => {
              const isActive = c.slug === active;
              return (
                <li key={c.slug}>
                  <Link
                    href={getCategoryHref(c.slug)}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/30"
                        : "text-stone-300 hover:bg-stone-800 hover:text-white"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex size-8 items-center justify-center rounded-lg text-base transition-colors ${
                        isActive ? "bg-amber-300" : "bg-stone-800 group-hover:bg-stone-700"
                      }`}
                    >
                      {icons[c.slug]}
                    </span>
                    <span className="flex-1">{c.slug === "all" ? "Все коллажи" : c.label.replace(" Collage", "")}</span>
                    <span className="rounded-full bg-stone-800 px-2 py-0.5 text-xs text-stone-400 tabular-nums">
                      {getTemplatesByCategory(c.slug).length}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex-1" />
        <SidebarPlayer />
      </aside>
    </>
  );
}

function SidebarPlayer() {
  const { playing, track, volume, error, toggle, selectTrack, setVolume } = useMusic();

  return (
    <section
      aria-label="Музыка"
      className="m-3 rounded-2xl bg-gradient-to-br from-amber-300/20 via-stone-800 to-stone-900 p-4 ring-1 ring-stone-700"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Пауза" : "Включить музыку"}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-300 text-stone-950 shadow-lg shadow-amber-300/20 transition-transform hover:scale-105 hover:bg-amber-200"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="size-5" fill="currentColor">
            {playing ? <path d="M6 4h3v12H6zM11 4h3v12h-3z" /> : <path d="M7 4.5v11l9-5.5z" />}
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] tracking-[0.18em] text-stone-500 uppercase">
            {playing ? "Сейчас играет" : "Музыка"}
          </p>
          <p className="truncate font-display text-lg leading-tight text-stone-100">{track.title}</p>
          <p className="truncate text-xs text-stone-400">{track.mood}</p>
        </div>
        <Equalizer playing={playing} className="text-amber-300" />
      </div>

      <div role="radiogroup" aria-label="Настроение музыки" className="mt-4 grid grid-cols-3 gap-1.5">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={t.id === track.id}
            onClick={() => selectTrack(t.id)}
            className={`rounded-lg px-2 py-1.5 text-xs transition-colors ${
              t.id === track.id
                ? "bg-amber-300 font-semibold text-stone-950"
                : "bg-stone-800/80 text-stone-300 hover:bg-stone-700"
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      <label className="mt-4 flex items-center gap-3 text-xs text-stone-400">
        <span aria-hidden>🔈</span>
        <span className="sr-only">Громкость</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-amber-300"
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
