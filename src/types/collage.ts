export type CategorySlug =
  | "all"
  | "travel"
  | "birthday"
  | "memories"
  | "friends"
  | "family"
  | "love"
  | "wedding"
  | "holidays"
  | "moodboard"
  | "nature";

export interface Category {
  slug: CategorySlug;
  label: string;
}

export type LayoutId =
  | "grid"
  | "heroLeft"
  | "heroTop"
  | "strip"
  | "mosaic"
  | "six"
  | "feature"
  | "film"
  | "pinwheel";

/** Раскладка коллажа: CSS-сетка и области ячеек в формате grid-area. */
export interface CollageLayout {
  id: LayoutId;
  label: string;
  columns: number;
  rows: number;
  cells: string[];
}

export type FontId = "sans" | "mono" | "serif" | "display" | "script";

export interface FontOption {
  id: FontId;
  label: string;
  family: string;
}

export interface CollageText {
  id: string;
  text: string;
  fontId: FontId;
  color: string;
  /** Размер шрифта в px при ширине коллажа TEXT_REFERENCE_WIDTH. */
  size: number;
  bold: boolean;
  /** Центр текста в процентах от ширины и высоты коллажа. */
  x: number;
  y: number;
  /** Светлая подложка под текстом. */
  background: boolean;
}

/** Фото в ячейке и его кадрирование. Пустая строка в src — ячейка без фото. */
export interface PhotoSlot {
  src: string;
  /** Точка кадра в процентах, как у object-position. */
  x: number;
  y: number;
  /** Увеличение относительно object-fit: cover, от 1. */
  zoom: number;
}

export type AspectId = "4/3" | "1/1" | "3/4";

/** Оформление коллажа: цвет рамки, отступы, скругление (px при ширине TEXT_REFERENCE_WIDTH) и формат. */
export interface CollageStyle {
  background: string;
  gap: number;
  radius: number;
  aspect: AspectId;
}

/** Всё, что пользователь может изменить в коллаже. */
export interface CollageState {
  layoutId: LayoutId;
  /**
   * Фото проекта по порядку. Первые N показываются в ячейках раскладки;
   * лишние сохраняются, чтобы смена раскладки не теряла снимки.
   */
  photos: PhotoSlot[];
  texts: CollageText[];
  style: CollageStyle;
}

export interface CollageTemplate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: Exclude<CategorySlug, "all">;
  layout: LayoutId;
  /** Tailwind-классы фона пустых ячеек, применяются по кругу. */
  palette: string[];
  /** Готовые фото по ячейкам раскладки. */
  photos: string[];
}
