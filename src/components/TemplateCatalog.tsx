import { categories, getTemplatesByCategory } from "@/data/templates";
import type { CategorySlug } from "@/types/collage";
import { Sidebar } from "./Sidebar";
import { TemplateCard } from "./TemplateCard";

export function TemplateCatalog({ category }: { category: CategorySlug }) {
  const items = getTemplatesByCategory(category);
  const title = categories.find((c) => c.slug === category)?.label;

  return (
    <div className="flex flex-1 flex-col bg-stone-950 text-stone-100 md:flex-row">
      <Sidebar active={category} />
      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-8 md:px-10 md:py-12">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-2 border-b border-stone-800 pb-6">
          <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
          <p className="text-sm text-stone-400">Шаблонов: {items.length}</p>
        </header>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-700 px-6 py-12 text-center text-sm text-stone-400">
            В этой категории пока нет шаблонов.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 2xl:grid-cols-3">
            {items.map((template, i) => (
              <li key={template.id}>
                <TemplateCard template={template} eager={i < 2} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
