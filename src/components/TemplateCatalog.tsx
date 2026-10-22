import { categories, getTemplatesByCategory } from "@/data/templates";
import type { CategorySlug } from "@/types/collage";
import { Sidebar } from "./Sidebar";
import { TemplateCard } from "./TemplateCard";

export function TemplateCatalog({ category }: { category: CategorySlug }) {
  const items = getTemplatesByCategory(category);
  const title = categories.find((c) => c.slug === category)?.label;

  return (
    <div className="flex flex-1 flex-col bg-neutral-50 md:flex-row">
      <Sidebar active={category} />
      <main className="flex-1 px-4 py-6 md:px-10 md:py-10">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
          <p className="mt-1 text-sm text-neutral-500">Шаблонов: {items.length}</p>
        </header>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((template) => (
            <li key={template.id}>
              <TemplateCard template={template} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
