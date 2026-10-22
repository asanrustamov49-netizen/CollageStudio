import type {
  Category,
  CategorySlug,
  CollageLayout,
  CollageTemplate,
  CollageText,
  FontId,
  FontOption,
} from "@/types/collage";

export const categories: Category[] = [
  { slug: "all", label: "All Collages" },
  { slug: "nature", label: "Nature Collage" },
  { slug: "friends", label: "Friends Collage" },
  { slug: "wedding", label: "Wedding Collage" },
];

const layouts = {
  grid: { columns: 2, rows: 2, cells: ["1/1/2/2", "1/2/2/3", "2/1/3/2", "2/2/3/3"] },
  heroLeft: { columns: 3, rows: 2, cells: ["1/1/3/3", "1/3/2/4", "2/3/3/4"] },
  heroTop: { columns: 2, rows: 3, cells: ["1/1/3/3", "3/1/4/2", "3/2/4/3"] },
  strip: { columns: 3, rows: 1, cells: ["1/1/2/2", "1/2/2/3", "1/3/2/4"] },
  mosaic: {
    columns: 3,
    rows: 3,
    cells: ["1/1/3/3", "1/3/2/4", "2/3/3/4", "3/1/4/2", "3/2/4/4"],
  },
} satisfies Record<string, CollageLayout>;

const palettes = {
  nature: ["bg-emerald-200", "bg-lime-100", "bg-teal-300", "bg-green-100", "bg-emerald-300"],
  friends: ["bg-amber-200", "bg-orange-100", "bg-sky-200", "bg-yellow-100", "bg-rose-200"],
  wedding: ["bg-rose-100", "bg-stone-200", "bg-pink-200", "bg-neutral-100", "bg-rose-200"],
};

export const templates: CollageTemplate[] = [
  { id: "forest-walk", title: "Forest Walk", category: "nature", layout: layouts.heroLeft, palette: palettes.nature },
  { id: "mountain-views", title: "Mountain Views", category: "nature", layout: layouts.mosaic, palette: palettes.nature },
  { id: "seasons", title: "Four Seasons", category: "nature", layout: layouts.grid, palette: palettes.nature },
  { id: "weekend-trip", title: "Weekend Trip", category: "friends", layout: layouts.mosaic, palette: palettes.friends },
  { id: "photo-strip", title: "Photo Strip", category: "friends", layout: layouts.strip, palette: palettes.friends },
  { id: "best-moments", title: "Best Moments", category: "friends", layout: layouts.heroTop, palette: palettes.friends },
  { id: "big-day", title: "The Big Day", category: "wedding", layout: layouts.heroTop, palette: palettes.wedding },
  { id: "vows", title: "Vows & Rings", category: "wedding", layout: layouts.grid, palette: palettes.wedding },
  { id: "celebration", title: "Celebration", category: "wedding", layout: layouts.heroLeft, palette: palettes.wedding },
];

export function getTemplatesByCategory(slug: CategorySlug): CollageTemplate[] {
  return slug === "all" ? templates : templates.filter((t) => t.category === slug);
}

export function isCategorySlug(value: string): value is CategorySlug {
  return categories.some((c) => c.slug === value);
}

export function getCategoryHref(slug: CategorySlug): string {
  return slug === "all" ? "/" : `/collages/${slug}`;
}

export function getCategoryLabel(slug: CategorySlug): string {
  return categories.find((c) => c.slug === slug)?.label ?? "";
}

export function getTemplateById(id: string): CollageTemplate | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplateHref(id: string): string {
  return `/templates/${id}`;
}

export const fontOptions: FontOption[] = [
  { id: "sans", label: "Geist Sans", family: "var(--font-geist-sans), sans-serif" },
  { id: "mono", label: "Geist Mono", family: "var(--font-geist-mono), monospace" },
  { id: "serif", label: "Serif", family: "Georgia, 'Times New Roman', serif" },
  { id: "script", label: "Script", family: "'Segoe Script', 'Brush Script MT', cursive" },
];

export function getFontFamily(id: FontId): string {
  return fontOptions.find((f) => f.id === id)?.family ?? fontOptions[0].family;
}

export function getInitialTexts(template: CollageTemplate): CollageText[] {
  return [
    { id: "title", text: template.title, fontId: "sans", color: "#171717", position: "top" },
    {
      id: "caption",
      text: getCategoryLabel(template.category),
      fontId: "serif",
      color: "#525252",
      position: "bottom",
    },
  ];
}
