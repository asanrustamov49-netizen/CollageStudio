export type CategorySlug =
  | "all"
  | "nature"
  | "friends"
  | "wedding"
  | "travel"
  | "birthday"
  | "memories";

export interface Category {
  slug: CategorySlug;
  label: string;
}

/** Раскладка коллажа: CSS-сетка и области ячеек в формате grid-area. */
export interface CollageLayout {
  columns: number;
  rows: number;
  cells: string[];
}

export type FontId = "sans" | "mono" | "serif" | "script";

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
  /** Центр текста в процентах от ширины и высоты коллажа. */
  x: number;
  y: number;
  /** Светлая подложка под текстом. */
  background: boolean;
}

/** Фото в ячейке и его кадрирование. */
export interface PhotoSlot {
  src: string;
  /** Точка кадра в процентах, как у object-position. */
  x: number;
  y: number;
  /** Увеличение относительно object-fit: cover, от 1. */
  zoom: number;
}

/** Всё, что пользователь может изменить в коллаже. */
export interface CollageState {
  photos: PhotoSlot[];
  texts: CollageText[];
}

export interface CollageTemplate {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<CategorySlug, "all">;
  layout: CollageLayout;
  /** Tailwind-классы фона ячеек, применяются по кругу. */
  palette: string[];
  /** Готовые фото по ячейкам раскладки. */
  photos: string[];
}
