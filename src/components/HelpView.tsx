"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { faqs, type Faq } from "@/data/content";
import { Icon } from "./ui/Icon";
import { ui } from "./ui/styles";

const topics: Faq["topic"][] = ["Проекты", "Фото", "Экспорт и печать", "Подарки", "Аккаунт"];

/** Вопросы и ответы с поиском и фильтром по теме. */
export function HelpView() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Faq["topic"] | null>(null);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((f) => (!topic || f.topic === topic) && (!q || `${f.q} ${f.a}`.toLowerCase().includes(q)));
  }, [query, topic]);

  return (
    <main className="flex-1 px-4 py-14 md:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs tracking-[0.2em] text-amber-300 uppercase">Помощь</p>
        <h1 className="mt-3 font-display text-4xl md:text-6xl">Вопросы и ответы</h1>
        <label className="relative mt-8 block">
          <span className="sr-only">Поиск по вопросам</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: печать, QR, удалить аккаунт"
            className="block min-h-12 w-full rounded-2xl border border-stone-700 bg-stone-900 pr-4 pl-12 text-base text-stone-100 placeholder:text-stone-500 focus:border-amber-300 focus:outline-none"
          />
        </label>
        <div role="group" aria-label="Темы вопросов" className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,#000_88%,transparent)] md:mx-0 md:flex-wrap md:px-0 md:[mask-image:none]">
          {[null, ...topics].map((t) => (
            <button
              key={t ?? "all"}
              type="button"
              aria-pressed={topic === t}
              onClick={() => setTopic(t)}
              className={`min-h-10 shrink-0 rounded-full px-4 text-sm ${topic === t ? "bg-stone-100 text-stone-950" : "border border-stone-700 text-stone-300 hover:border-stone-500"}`}
            >
              {t ?? "Все"}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm text-stone-500" aria-live="polite">Найдено: {visible.length}</p>
        {visible.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-stone-700 p-8 text-center text-stone-400">
            Ничего не нашлось. Попробуйте другое слово или посмотрите <Link href="/guide" className="text-amber-300 hover:underline">пошаговую инструкцию</Link>.
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-stone-800 rounded-2xl bg-stone-900 ring-1 ring-stone-800">
            {visible.map((f) => (
              <li key={f.q}>
                <details className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 text-stone-100 [&::-webkit-details-marker]:hidden">
                    <span className="flex-1">{f.q}</span>
                    <span className="hidden rounded-full bg-stone-800 px-2.5 py-0.5 text-[11px] text-stone-400 sm:inline">{f.topic}</span>
                    <Icon name="down" className="size-5 text-stone-500 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-stone-400">{f.a}</p>
                </details>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-stone-900 p-6 ring-1 ring-stone-800">
          <p className="text-sm text-stone-300">Пошаговая инструкция и таблица размеров для печати</p>
          <Link href="/guide" className={ui.darkSecondary}>Как это работает →</Link>
        </div>
      </div>
    </main>
  );
}
