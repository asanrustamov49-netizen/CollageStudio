import Link from "next/link";
import {
  categories,
  getCategoryHref,
  getTemplateById,
  templates,
} from "@/data/templates";
import type { CollageTemplate } from "@/types/collage";
import { HeroStack } from "./HeroStack";
import { MusicControl } from "./MusicControl";

const showcase = ["mountain-views", "big-day", "party-time"]
  .map(getTemplateById)
  .filter((t): t is CollageTemplate => Boolean(t));

export function StartScreen() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-stone-950 text-stone-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(252,211,77,0.16),transparent),radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(244,114,182,0.08),transparent)]"
      />

      <header className="relative z-10 flex items-center justify-between px-4 py-5 md:px-10">
        <span className="font-display text-2xl italic">Collage Studio</span>
        <Link
          href={getCategoryHref("all")}
          className="rounded-full border border-stone-700 px-4 py-1.5 text-sm text-stone-300 hover:border-stone-500 hover:text-white"
        >
          Каталог
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center px-4 pt-8 pb-28 text-center md:px-10">
        <p className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-1 text-xs tracking-[0.2em] text-amber-200 uppercase">
          {templates.length} готовых коллажей · {categories.length - 1} тем
        </p>
        <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.05] text-balance sm:text-7xl">
          Ваши моменты&nbsp;— <em className="text-amber-300">в одном кадре</em>
        </h1>
        <p className="mt-6 max-w-xl text-base text-pretty text-stone-400">
          Выберите готовую композицию с фотографиями, замените снимки своими, подпишите
          и скачайте результат в PNG высокого качества.
        </p>
        <Link
          href={getCategoryHref("all")}
          className="mt-8 rounded-full bg-amber-300 px-7 py-3 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-300/20 hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
        >
          Открыть каталог шаблонов →
        </Link>

        {showcase.length > 0 && <HeroStack templates={showcase} />}

        <ul className="mt-4 flex max-w-2xl flex-wrap justify-center gap-2" aria-label="Темы">
          {categories
            .filter((c) => c.slug !== "all")
            .map((c) => (
              <li key={c.slug}>
                <Link
                  href={getCategoryHref(c.slug)}
                  className="block rounded-full border border-stone-800 bg-stone-900 px-4 py-2 text-sm text-stone-300 hover:border-amber-300/60 hover:text-amber-200"
                >
                  {c.label.replace(" Collage", "")}
                </Link>
              </li>
            ))}
        </ul>
      </main>

      <div className="fixed bottom-4 left-4 z-40 max-w-[calc(100%-2rem)]">
        <MusicControl />
      </div>
    </div>
  );
}
