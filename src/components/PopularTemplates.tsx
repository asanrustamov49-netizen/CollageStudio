import { getTemplateById } from "@/data/templates";
import type { CollageTemplate } from "@/types/collage";
import { TemplateCard } from "./TemplateCard";

const popular = ["city-lights", "party-time", "two-hearts"];

/** Подсказка для пустых разделов: несколько популярных шаблонов. */
export function PopularTemplates({ title = "Популярные шаблоны" }: { title?: string }) {
  const items = popular.map(getTemplateById).filter((t): t is CollageTemplate => Boolean(t));
  return (
    <section className="mt-12" aria-label={title}>
      <h2 className="font-display text-2xl">{title}</h2>
      <ul className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,17rem),1fr))]">
        {items.map((t) => (
          <li key={t.id}>
            <TemplateCard template={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}
