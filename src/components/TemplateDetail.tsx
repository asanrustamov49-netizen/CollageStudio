import Link from "next/link";
import { getCategoryHref, getCategoryLabel, getInitialState, getLayout, getTemplatesByCategory } from "@/data/templates";
import type { CollageTemplate } from "@/types/collage";
import { CreateProjectButton } from "./CreateProjectButton";
import { FavoriteButton } from "./FavoriteButton";
import { TemplateCard } from "./TemplateCard";
import { TemplatePreview } from "./TemplatePreview";
import { Icon } from "./ui/Icon";
import { ui } from "./ui/styles";

const perks = [
  "Замените фото своими — кадр подстраивается под ячейку",
  "Меняйте подписи, шрифты, цвета и макет",
  "Скачайте PNG, JPG или PDF либо подарите по QR-коду",
];

/** Просмотр шаблона перед созданием проекта. */
export function TemplateDetail({ template }: { template: CollageTemplate }) {
  const layout = getLayout(template.layout);
  const related = getTemplatesByCategory(template.category).filter((t) => t.id !== template.id);

  return (
    <div className="flex-1 bg-stone-950 text-stone-100">
      <nav aria-label="Навигация" className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 pt-6 text-sm text-stone-500 md:px-10">
        <Link href="/collages" className="hover:text-stone-200">Каталог</Link>
        <Icon name="right" className="size-3.5" />
        <Link href={getCategoryHref(template.category)} className="hover:text-stone-200">{getCategoryLabel(template.category)}</Link>
        <Icon name="right" className="size-3.5" />
        <span className="truncate text-stone-300">{template.title}</span>
      </nav>
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 md:px-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-8">
        <div className="self-start overflow-hidden rounded-2xl shadow-2xl ring-1 shadow-black/50 ring-stone-800">
          <TemplatePreview template={template} state={getInitialState(template)} sizes="(min-width: 1024px) 60vw, 100vw" eager />
        </div>
        <section className="flex flex-col gap-5">
          <div>
            <p className="text-xs tracking-[0.2em] text-amber-300 uppercase">{getCategoryLabel(template.category)}</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">{template.title}</h1>
            <p className="mt-3 text-stone-400">{template.description}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-stone-900 p-3 ring-1 ring-stone-800">
              <dt className="text-stone-500">Макет</dt>
              <dd className="mt-0.5 text-stone-100">{layout.label}</dd>
            </div>
            <div className="rounded-xl bg-stone-900 p-3 ring-1 ring-stone-800">
              <dt className="text-stone-500">Фото</dt>
              <dd className="mt-0.5 text-stone-100">{layout.cells.length}</dd>
            </div>
          </dl>
          <ul className="space-y-2 text-sm text-stone-300">
            {perks.map((line) => (
              <li key={line} className="flex gap-2">
                <Icon name="check" className="size-5 text-amber-300" /> {line}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <CreateProjectButton templateId={template.id} className={`${ui.accent} flex-1`} />
            <FavoriteButton templateId={template.id} title={template.title} className="border border-stone-700" />
          </div>
          <p className="text-xs text-stone-500">Фото в шаблоне — демонстрационные снимки Unsplash, а не чьи-то личные данные.</p>
        </section>
      </main>
      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 md:px-10">
          <h2 className="font-display text-2xl">Ещё в теме «{getCategoryLabel(template.category)}»</h2>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2">
            {related.map((t) => (
              <li key={t.id}>
                <TemplateCard template={t} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
