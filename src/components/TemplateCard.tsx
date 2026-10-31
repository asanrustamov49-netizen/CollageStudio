import Link from "next/link";
import {
  getCategoryLabel,
  getInitialState,
  getLayout,
  getTemplateHref,
} from "@/data/templates";
import type { CollageTemplate } from "@/types/collage";
import { CreateProjectButton } from "./CreateProjectButton";
import { FavoriteButton } from "./FavoriteButton";
import { TemplatePreview } from "./TemplatePreview";
import { Icon } from "./ui/Icon";
import { ui } from "./ui/styles";

export function TemplateCard({
  template,
  eager,
}: {
  template: CollageTemplate;
  eager?: boolean;
}) {
  const layout = getLayout(template.layout);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-stone-900 ring-1 ring-stone-800 transition hover:ring-stone-600">
      <div className="relative">
        <FavoriteButton
          templateId={template.id}
          title={template.title}
          className="absolute top-4 right-4 z-10"
        />
        <Link
          href={getTemplateHref(template.id)}
          aria-label={`${template.title}: посмотреть шаблон`}
          className="block p-2 pb-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <div className="overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-[1.01] motion-reduce:transition-none">
            <TemplatePreview
              template={template}
              state={getInitialState(template)}
              eager={eager}
            />
          </div>
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pt-3 pb-4">
        <div>
          <p className="text-[11px] tracking-wide text-stone-500 uppercase">
            {getCategoryLabel(template.category)} · {layout.label} ·{" "}
            {layout.cells.length} фото
          </p>
          <h3 className="mt-1 font-display text-xl text-stone-100">
            {template.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-stone-400">
            {template.description}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          <CreateProjectButton
            templateId={template.id}
            label="Использовать"
            className={`${ui.accent} flex-1`}
          />
          <Link
            href={getTemplateHref(template.id)}
            className={ui.darkSecondary}
          >
            <Icon name="eye" className="size-4" /> Просмотр
          </Link>
        </div>
      </div>
    </article>
  );
}
