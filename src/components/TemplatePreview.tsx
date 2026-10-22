import type { ReactNode } from "react";
import type { CollageTemplate } from "@/types/collage";

interface TemplatePreviewProps {
  template: CollageTemplate;
  /** Содержимое ячейки; без него превью декоративное. */
  renderCell?: (index: number) => ReactNode;
}

export function TemplatePreview({ template, renderCell }: TemplatePreviewProps) {
  const { layout, palette } = template;
  return (
    <div
      aria-hidden={renderCell ? undefined : true}
      className="grid aspect-[4/3] gap-1.5 bg-white p-1.5"
      style={{
        gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
      }}
    >
      {layout.cells.map((area, i) => (
        <div
          key={area}
          className={`relative overflow-hidden rounded-md ${palette[i % palette.length]}`}
          style={{ gridArea: area }}
        >
          {renderCell?.(i)}
        </div>
      ))}
    </div>
  );
}
