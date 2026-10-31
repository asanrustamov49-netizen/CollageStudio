"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { categories, getCategoryHref, getLayout } from "@/data/templates";
import type { CategorySlug, CollageTemplate } from "@/types/collage";
import { TemplateCard } from "./TemplateCard";
import { categoryIcons } from "./ui/categoryIcons";
import { Icon } from "./ui/Icon";
import { ui } from "./ui/styles";

type Sort = "popular" | "name" | "photos";
const counts = [3, 4, 5, 6];

export function CatalogView({
  category,
  title,
  items,
  showCategories = true,
}: {
  category: CategorySlug;
  title: string;
  items: CollageTemplate[];
  showCategories?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("popular");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter(
      (t) =>
        (!q ||
          `${t.title} ${t.subtitle} ${t.description}`
            .toLowerCase()
            .includes(q)) &&
        (count === null || getLayout(t.layout).cells.length === count),
    );
    if (sort === "name")
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "photos")
      return [...list].sort(
        (a, b) =>
          getLayout(b.layout).cells.length - getLayout(a.layout).cells.length,
      );
    return list;
  }, [items, query, count, sort]);

  const filtered = query.trim() !== "" || count !== null;
  const reset = () => {
    setQuery("");
    setCount(null);
  };

  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
          <p className="mt-1 text-sm text-stone-400" aria-live="polite">
            {filtered
              ? `Найдено: ${visible.length} из ${items.length}`
              : `Шаблонов: ${items.length}`}
          </p>
        </div>
      </header>

      {showCategories && (
        <nav aria-label="Темы" className="-mx-4 mt-6 md:-mx-10">
          <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,#000_90%,transparent)] md:px-10">
            {categories.map((c) => (
              <li key={c.slug} className="shrink-0">
                <Link
                  href={getCategoryHref(c.slug)}
                  aria-current={c.slug === category ? "page" : undefined}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm whitespace-nowrap transition-colors ${c.slug === category ? "bg-amber-300 font-semibold text-stone-950" : "border border-stone-800 bg-stone-900 text-stone-300 hover:border-stone-600 hover:text-white"}`}
                >
                  <Icon name={categoryIcons[c.slug]} className="size-4" />
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-5 grid gap-3 border-b border-stone-800 pb-6 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Поиск шаблонов</span>
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-stone-500"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: море, торт, свадьба…"
            className="block min-h-11 w-full rounded-xl border border-stone-700 bg-stone-900 py-2 pr-3 pl-11 text-base text-stone-100 placeholder:text-stone-500 focus:border-amber-300 focus:outline-none sm:text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-400">
          <Icon name="sort" className="size-4" />
          <span className="sr-only sm:not-sr-only">Сортировка</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="min-h-11 flex-1 rounded-xl border border-stone-700 bg-stone-900 px-3 text-sm text-stone-100 focus:border-amber-300 focus:outline-none"
          >
            <option value="popular">Сначала популярные</option>
            <option value="name">По названию</option>
            <option value="photos">Больше фото</option>
          </select>
        </label>
        <div
          role="group"
          aria-label="Количество фото"
          className="flex flex-wrap items-center gap-2 sm:col-span-2"
        >
          <span className="text-xs text-stone-500">Фото в макете:</span>
          {counts.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={count === n}
              onClick={() => setCount(count === n ? null : n)}
              className={`min-h-9 min-w-9 rounded-full px-3.5 text-sm ${count === n ? "bg-stone-100 text-stone-950" : "border border-stone-700 text-stone-300 hover:border-stone-500"}`}
            >
              {n}
            </button>
          ))}
          {filtered && (
            <button
              type="button"
              onClick={reset}
              className="min-h-9 px-2 text-sm text-amber-300 underline-offset-2 hover:underline"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-700 px-6 py-14 text-center">
          <Icon name="search" className="size-8 text-stone-600" />
          <p className="font-display text-2xl">Ничего не нашлось</p>
          <p className="max-w-sm text-sm text-stone-400">
            Попробуйте другое слово или уберите фильтр по количеству фото.
          </p>
          <button type="button" onClick={reset} className={ui.darkSecondary}>
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,19rem),1fr))]">
          {visible.map((template, i) => (
            <li key={template.id}>
              <TemplateCard template={template} eager={i < 2} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
