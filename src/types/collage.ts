export type CategorySlug = "all" | "nature" | "friends" | "wedding";

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
  position: "top" | "bottom";
}

export interface CollageTemplate {
  id: string;
  title: string;
  category: Exclude<CategorySlug, "all">;
  layout: CollageLayout;
  /** Tailwind-классы фона ячеек, применяются по кругу. */
  palette: string[];
}
