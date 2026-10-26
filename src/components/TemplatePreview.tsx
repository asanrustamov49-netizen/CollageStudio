import type { HTMLAttributes, ReactNode, Ref } from "react";
import { getFontFamily, getTextFontSize } from "@/data/templates";
import type { CollageState, CollageTemplate, CollageText } from "@/types/collage";
import { CollagePhoto } from "./CollagePhoto";

type ElementProps = HTMLAttributes<HTMLDivElement> & Record<`data-${string}`, string | boolean | undefined>;

interface TemplatePreviewProps {
  template: CollageTemplate;
  state: CollageState;
  /** Атрибут sizes для фото, по умолчанию — под карточку каталога. */
  sizes?: string;
  /** Фото над первым экраном: загружать сразу. */
  eager?: boolean;
  ref?: Ref<HTMLDivElement>;
  /** Обработчики и классы ячейки в редакторе; без них превью декоративное. */
  cellProps?: (index: number) => ElementProps;
  renderCellOverlay?: (index: number) => ReactNode;
  textProps?: (text: CollageText) => ElementProps;
}

const cardSizes = "(min-width: 1280px) 22vw, (min-width: 640px) 40vw, 90vw";

export function TemplatePreview({
  template,
  state,
  sizes = cardSizes,
  eager,
  ref,
  cellProps,
  renderCellOverlay,
  textProps,
}: TemplatePreviewProps) {
  const { layout, palette } = template;
  const interactive = Boolean(cellProps);

  return (
    <div
      ref={ref}
      aria-hidden={interactive ? undefined : true}
      className="@container relative grid aspect-[4/3] gap-1.5 overflow-hidden bg-white p-1.5"
      style={{
        gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
      }}
    >
      {layout.cells.map((area, i) => {
        const { className = "", ...rest } = cellProps?.(i) ?? {};
        const slot = state.photos[i];
        return (
          <div
            key={area}
            data-cell
            {...rest}
            className={`relative overflow-hidden rounded-md ${palette[i % palette.length]} ${className}`}
            style={{ gridArea: area }}
          >
            {slot && <CollagePhoto slot={slot} sizes={sizes} eager={eager} />}
            {renderCellOverlay?.(i)}
          </div>
        );
      })}
      {state.texts.map((t) => {
        const { className = "", ...rest } = textProps?.(t) ?? {};
        return (
          <div
            key={t.id}
            data-text
            {...rest}
            className={`absolute w-max max-w-[90%] -translate-x-1/2 -translate-y-1/2 truncate rounded-[0.3em] px-[0.6em] py-[0.25em] leading-tight ${t.background ? "bg-white/85 shadow-sm" : ""} ${className}`}
            style={{
              left: `${t.x}%`,
              top: `${t.y}%`,
              fontFamily: getFontFamily(t.fontId),
              fontSize: getTextFontSize(t.size),
              color: t.color,
            }}
          >
            {t.text}
          </div>
        );
      })}
    </div>
  );
}
