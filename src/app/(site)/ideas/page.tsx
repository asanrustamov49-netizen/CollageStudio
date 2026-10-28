import type { Metadata } from "next";
import Link from "next/link";
import { TemplateCard } from "@/components/TemplateCard";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { ideaCollections } from "@/data/content";
import { getTemplateById } from "@/data/templates";
import type { CollageTemplate } from "@/types/collage";

export const metadata: Metadata = {
  title: "Идеи для коллажей",
  description: "Подборки шаблонов и советы: коллаж после отпуска, подарок бабушке, годовщина, день рождения, новогодняя открытка, доска мечты.",
};

export default function IdeasPage() {
  return (
    <main className="flex-1">
      <section className="border-b border-stone-900 px-4 py-14 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs tracking-[0.2em] text-amber-300 uppercase">Идеи и подборки</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl text-balance md:text-6xl">Не знаете, с чего начать? Выберите повод</h1>
          <p className="mt-4 max-w-2xl text-stone-400">Для каждого повода — подходящие шаблоны и короткие советы: какие фото поставить в главную ячейку, какой выбрать шрифт и формат.</p>
          <nav aria-label="Поводы" className="-mx-4 mt-8 md:mx-0">
            <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,#000_88%,transparent)] md:flex-wrap md:px-0 md:[mask-image:none]">
              {ideaCollections.map((c) => (
                <li key={c.id} className="shrink-0">
                  <a href={`#${c.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-800 bg-stone-900 px-4 text-sm text-stone-300 hover:border-amber-300/60 hover:text-white">
                    <Icon name={c.icon} className="size-4 text-amber-300" /> {c.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-14 md:px-8">
        {ideaCollections.map((c) => {
          const items = c.templateIds.map(getTemplateById).filter((t): t is CollageTemplate => Boolean(t));
          return (
            <section key={c.id} id={c.id} aria-labelledby={`${c.id}-title`} className="scroll-mt-24">
              <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
                <div>
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-300 text-stone-950">
                    <Icon name={c.icon} className="size-6" />
                  </span>
                  <h2 id={`${c.id}-title`} className="mt-4 font-display text-3xl">{c.title}</h2>
                  <p className="mt-2 text-stone-400">{c.description}</p>
                  <ul className="mt-5 space-y-3 text-sm text-stone-300">
                    {c.tips.map((tip) => (
                      <li key={tip} className="flex gap-2.5">
                        <Icon name="check" className="mt-0.5 size-4 text-amber-300" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                <ul className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,17rem),1fr))]">
                  {items.map((t) => (
                    <li key={t.id}>
                      <TemplateCard template={t} />
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>

      <section className="px-4 pb-16 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 rounded-3xl bg-stone-900 p-8 ring-1 ring-stone-800">
          <div>
            <h2 className="font-display text-2xl">Своя идея?</h2>
            <p className="mt-1 text-sm text-stone-400">В каталоге — все шаблоны с поиском по слову и фильтром по количеству фото.</p>
          </div>
          <Link href="/collages" className={ui.accent}>Открыть каталог →</Link>
        </div>
      </section>
    </main>
  );
}
