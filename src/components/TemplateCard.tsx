import Link from "next/link";
import { getCategoryLabel, getTemplateHref } from "@/data/templates";
import type { CollageTemplate } from "@/types/collage";
import { DraftPreview } from "./DraftPreview";

export function TemplateCard({ template }: { template: CollageTemplate }) {
  return (
    <Link
      href={getTemplateHref(template.id)}
      className="block overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
    >
      <DraftPreview template={template} />
      <div className="border-t border-neutral-100 px-4 py-3">
        <h3 className="text-sm font-medium text-neutral-900">{template.title}</h3>
        <p className="mt-0.5 text-xs text-neutral-500">{getCategoryLabel(template.category)}</p>
      </div>
    </Link>
  );
}
