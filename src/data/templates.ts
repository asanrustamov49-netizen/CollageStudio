import type {
  Category,
  CategorySlug,
  CollageLayout,
  CollageState,
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
  { slug: "travel", label: "Travel Collage" },
  { slug: "birthday", label: "Birthday Collage" },
  { slug: "memories", label: "Memories Collage" },
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
  travel: ["bg-sky-200", "bg-cyan-100", "bg-blue-200", "bg-sky-100", "bg-indigo-100"],
  birthday: ["bg-fuchsia-200", "bg-pink-100", "bg-violet-200", "bg-amber-100", "bg-rose-200"],
  memories: ["bg-stone-200", "bg-amber-100", "bg-neutral-200", "bg-orange-100", "bg-stone-300"],
};

/** Фото из public/photos (Unsplash License). */
const photos = (category: CollageTemplate["category"], ...numbers: number[]) =>
  numbers.map((n) => `/photos/${category}-${n}.jpg`);

export const templates: CollageTemplate[] = [
  { id: "forest-walk", title: "Forest Walk", subtitle: "Тишина леса", category: "nature", layout: layouts.heroLeft, palette: palettes.nature, photos: photos("nature", 4, 5, 3) },
  { id: "mountain-views", title: "Mountain Views", subtitle: "Высоко в горах", category: "nature", layout: layouts.mosaic, palette: palettes.nature, photos: photos("nature", 12, 7, 11, 2, 8) },
  { id: "seasons", title: "Four Seasons", subtitle: "Цветы и поля", category: "nature", layout: layouts.grid, palette: palettes.nature, photos: photos("nature", 10, 9, 6, 1) },
  { id: "weekend-trip", title: "Weekend Trip", subtitle: "Выходные с друзьями", category: "friends", layout: layouts.mosaic, palette: palettes.friends, photos: photos("friends", 7, 6, 2, 8, 1) },
  { id: "photo-strip", title: "Photo Strip", subtitle: "Встречи и разговоры", category: "friends", layout: layouts.strip, palette: palettes.friends, photos: photos("friends", 8, 5, 4) },
  { id: "best-moments", title: "Best Moments", subtitle: "Лучшие моменты", category: "friends", layout: layouts.heroTop, palette: palettes.friends, photos: photos("friends", 1, 3, 6) },
  { id: "big-day", title: "The Big Day", subtitle: "Наш главный день", category: "wedding", layout: layouts.heroTop, palette: palettes.wedding, photos: photos("wedding", 7, 1, 8) },
  { id: "vows", title: "Vows & Rings", subtitle: "Навсегда вместе", category: "wedding", layout: layouts.grid, palette: palettes.wedding, photos: photos("wedding", 8, 1, 6, 2) },
  { id: "celebration", title: "Celebration", subtitle: "Праздник любви", category: "wedding", layout: layouts.heroLeft, palette: palettes.wedding, photos: photos("wedding", 2, 3, 5) },
  { id: "city-lights", title: "City Lights", subtitle: "Париж · Венеция · Токио", category: "travel", layout: layouts.mosaic, palette: palettes.travel, photos: photos("travel", 4, 8, 6, 10, 3) },
  { id: "summer-escape", title: "Summer Escape", subtitle: "Море и солнце", category: "travel", layout: layouts.heroLeft, palette: palettes.travel, photos: photos("travel", 5, 7, 1) },
  { id: "on-the-road", title: "On the Road", subtitle: "Новые маршруты", category: "travel", layout: layouts.grid, palette: palettes.travel, photos: photos("travel", 2, 9, 8, 7) },
  { id: "party-time", title: "Party Time", subtitle: "С днём рождения!", category: "birthday", layout: layouts.mosaic, palette: palettes.birthday, photos: photos("birthday", 6, 1, 4, 3, 5) },
  { id: "sweet-wishes", title: "Sweet Wishes", subtitle: "Сладких пожеланий", category: "birthday", layout: layouts.heroTop, palette: palettes.birthday, photos: photos("birthday", 8, 7, 2) },
  { id: "gift-box", title: "Gift Box", subtitle: "Подарки и сюрпризы", category: "birthday", layout: layouts.strip, palette: palettes.birthday, photos: photos("birthday", 7, 1, 4) },
  { id: "everyday-joy", title: "Everyday Joy", subtitle: "Маленькие радости", category: "memories", layout: layouts.grid, palette: palettes.memories, photos: photos("memories", 7, 2, 3, 6) },
  { id: "golden-hour", title: "Golden Hour", subtitle: "Тёплые вечера", category: "memories", layout: layouts.heroLeft, palette: palettes.memories, photos: photos("memories", 4, 5, 1) },
  { id: "little-moments", title: "Little Moments", subtitle: "Запомнить всё", category: "memories", layout: layouts.mosaic, palette: palettes.memories, photos: photos("memories", 8, 9, 7, 2, 4) },
];

export function getTemplatesByCategory(slug: CategorySlug): CollageTemplate[] {
  return slug === "all" ? templates : templates.filter((t) => t.category === slug);
}

export function isCategorySlug(value: string): value is CategorySlug {
  return categories.some((c) => c.slug === value);
}

export function getCategoryHref(slug: CategorySlug): string {
  return slug === "all" ? "/collages" : `/collages/${slug}`;
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

/** Ширина коллажа, к которой привязан размер текста: текст масштабируется вместе с коллажем. */
export const TEXT_REFERENCE_WIDTH = 768;

export function getTextFontSize(size: number): string {
  return `${((size / TEXT_REFERENCE_WIDTH) * 100).toFixed(3)}cqw`;
}

export function createText(id: string, patch: Partial<CollageText> = {}): CollageText {
  return {
    id,
    text: "Новый текст",
    fontId: "sans",
    color: "#171717",
    size: 28,
    x: 50,
    y: 50,
    background: true,
    ...patch,
  };
}

/** Исходная композиция шаблона: готовые фото и подписи. */
export function getInitialState(template: CollageTemplate): CollageState {
  return {
    photos: template.photos.map((src) => ({ src, x: 50, y: 50, zoom: 1 })),
    texts: [
      createText("title", { text: template.title, size: 30, y: 10 }),
      createText("caption", {
        text: template.subtitle,
        fontId: "serif",
        color: "#525252",
        size: 18,
        y: 91,
      }),
    ],
  };
}
