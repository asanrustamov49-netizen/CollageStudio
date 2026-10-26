"use client";

import { getInitialState } from "@/data/templates";
import { useCollageDraft } from "@/store/collageDrafts";
import type { CollageTemplate } from "@/types/collage";
import { TemplatePreview } from "./TemplatePreview";

/** Превью шаблона в каталоге с правками, сделанными в редакторе. */
export function DraftPreview({ template, eager }: { template: CollageTemplate; eager?: boolean }) {
  const present = useCollageDraft(template.id)?.present;
  return <TemplatePreview template={template} state={present ?? getInitialState(template)} eager={eager} />;
}
