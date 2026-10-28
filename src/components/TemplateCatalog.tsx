import { categories, getTemplatesByCategory } from "@/data/templates";
import type { CategorySlug } from "@/types/collage";
import { CatalogView } from "./CatalogView";

export function TemplateCatalog({ category }: { category: CategorySlug }) {
  const title = categories.find((c) => c.slug === category)?.label ?? "";
  return (
    <div className="flex flex-1 flex-col bg-stone-950 text-stone-100">
      <CatalogView category={category} title={title} items={getTemplatesByCategory(category)} />
    </div>
  );
}
