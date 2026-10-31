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
  size: number;
  bold: boolean;
  x: number;
  y: number;
  background: boolean;
}

export interface PhotoSlot {
  src: string;
  x: number;
  y: number;
  zoom: number;
}

export type AspectId = "4/3" | "1/1" | "3/4";

export interface CollageStyle {
  background: string;
  gap: number;
  radius: number;
  aspect: AspectId;
}

export interface CollageState {
  layoutId: LayoutId;
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
  palette: string[];
  photos: string[];
}
