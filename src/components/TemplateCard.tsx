import Link from "next/link";
import { getCategoryLabel, getTemplateHref } from "@/data/templates";
import type { CollageTemplate } from "@/types/collage";
import { DraftPreview } from "./DraftPreview";

export function TemplateCard({ template, eager }: { template: CollageTemplate; eager?: boolean }) {
  return (
    <Link
      href={getTemplateHref(template.id)}
      aria-label={`${template.title}: открыть в редакторе`}
      className="group block overflow-hidden rounded-2xl bg-stone-900 ring-1 ring-stone-800 transition hover:-translate-y-1 hover:ring-amber-300/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
    >
      <div className="p-2 pb-0">
        <div className="overflow-hidden rounded-xl">
          <DraftPreview template={template} eager={eager} />
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg text-stone-100">{template.title}</h3>
          <p className="mt-0.5 text-xs tracking-wide text-stone-500 uppercase">
            {getCategoryLabel(template.category).replace(" Collage", "")}
          </p>
        </div>
        <span className="ml-auto shrink-0 rounded-full border border-stone-700 px-3 py-1.5 text-xs font-medium text-stone-200 transition-colors group-hover:border-amber-300 group-hover:bg-amber-300 group-hover:text-stone-950">
          Редактировать →
        </span>
      </div>
    </Link>
  );
}
