"use client";

import Image from "next/image";
import { useCollageDraft } from "@/store/collageDrafts";
import type { CollageTemplate } from "@/types/collage";
import { TemplatePreview } from "./TemplatePreview";

/** Превью шаблона в каталоге с фото, загруженными в редакторе. */
export function DraftPreview({ template }: { template: CollageTemplate }) {
  const photos = useCollageDraft(template.id)?.photos;
  if (!photos || Object.keys(photos).length === 0) return <TemplatePreview template={template} />;

  return (
    <TemplatePreview
      template={template}
      renderCell={(index) =>
        photos[index] && (
          <Image src={photos[index]} alt="" fill unoptimized className="object-cover" />
        )
      }
    />
  );
}
