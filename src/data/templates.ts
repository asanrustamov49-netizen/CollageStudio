import type {
  AspectId,
  Category,
  CategorySlug,
  CollageLayout,
  CollageState,
  CollageStyle,
  CollageTemplate,
  CollageText,
  FontId,
  FontOption,
  LayoutId,
} from "@/types/collage";

export const categories: Category[] = [
  { slug: "all", label: "Все шаблоны" },
  { slug: "travel", label: "Путешествия" },
  { slug: "birthday", label: "День рождения" },
  { slug: "memories", label: "Воспоминания" },
  { slug: "friends", label: "Друзья" },
  { slug: "family", label: "Семья" },
  { slug: "love", label: "Любовь" },
  { slug: "wedding", label: "Свадьба" },
  { slug: "holidays", label: "Праздники" },
  { slug: "nature", label: "Природа" },
  { slug: "moodboard", label: "Мудборды" },
];

export const layouts: CollageLayout[] = [
  {
    id: "grid",
    label: "Сетка 2×2",
    columns: 2,
    rows: 2,
    cells: ["1/1/2/2", "1/2/2/3", "2/1/3/2", "2/2/3/3"],
  },
  {
    id: "heroLeft",
    label: "Главное слева",
    columns: 3,
    rows: 2,
    cells: ["1/1/3/3", "1/3/2/4", "2/3/3/4"],
  },
  {
    id: "heroTop",
    label: "Главное сверху",
    columns: 2,
    rows: 3,
    cells: ["1/1/3/3", "3/1/4/2", "3/2/4/3"],
  },
  {
    id: "strip",
    label: "Триптих",
    columns: 3,
    rows: 1,
    cells: ["1/1/2/2", "1/2/2/3", "1/3/2/4"],
  },
  {
    id: "film",
    label: "Плёнка",
    columns: 4,
    rows: 1,
    cells: ["1/1/2/2", "1/2/2/3", "1/3/2/4", "1/4/2/5"],
  },
  {
    id: "mosaic",
    label: "Мозаика",
    columns: 3,
    rows: 3,
    cells: ["1/1/3/3", "1/3/2/4", "2/3/3/4", "3/1/4/2", "3/2/4/4"],
  },
  {
    id: "pinwheel",
    label: "Вертушка",
    columns: 3,
    rows: 3,
    cells: ["1/1/2/3", "1/3/3/4", "2/1/4/2", "2/2/3/3", "3/2/4/4"],
  },
  {
    id: "feature",
    label: "Журнал",
    columns: 4,
    rows: 3,
    cells: ["1/2/3/4", "1/1/4/2", "1/4/4/5", "3/2/4/4"],
  },
  {
    id: "six",
    label: "Шесть кадров",
    columns: 3,
    rows: 2,
    cells: ["1/1/2/2", "1/2/2/3", "1/3/2/4", "2/1/3/2", "2/2/3/3", "2/3/3/4"],
  },
];

export function getLayout(id: LayoutId): CollageLayout {
  return layouts.find((l) => l.id === id) ?? layouts[0];
}

export const aspectOptions: { id: AspectId; label: string }[] = [
  { id: "4/3", label: "Альбом 4:3" },
  { id: "1/1", label: "Квадрат" },
  { id: "3/4", label: "Портрет 3:4" },
];

const palettes: Record<CollageTemplate["category"], string[]> = {
  nature: [
    "bg-emerald-200",
    "bg-lime-100",
    "bg-teal-300",
    "bg-green-100",
    "bg-emerald-300",
  ],
  friends: [
    "bg-amber-200",
    "bg-orange-100",
    "bg-sky-200",
    "bg-yellow-100",
    "bg-rose-200",
  ],
  wedding: [
    "bg-rose-100",
    "bg-stone-200",
    "bg-pink-200",
    "bg-neutral-100",
    "bg-rose-200",
  ],
  travel: [
    "bg-sky-200",
    "bg-cyan-100",
    "bg-blue-200",
    "bg-sky-100",
    "bg-indigo-100",
  ],
  birthday: [
    "bg-fuchsia-200",
    "bg-pink-100",
    "bg-violet-200",
    "bg-amber-100",
    "bg-rose-200",
  ],
  memories: [
    "bg-stone-200",
    "bg-amber-100",
    "bg-neutral-200",
    "bg-orange-100",
    "bg-stone-300",
  ],
  family: [
    "bg-orange-100",
    "bg-amber-100",
    "bg-lime-100",
    "bg-sky-100",
    "bg-rose-100",
  ],
  love: [
    "bg-rose-200",
    "bg-pink-100",
    "bg-red-100",
    "bg-rose-100",
    "bg-fuchsia-100",
  ],
  holidays: [
    "bg-red-200",
    "bg-emerald-100",
    "bg-amber-100",
    "bg-red-100",
    "bg-green-200",
  ],
  moodboard: [
    "bg-stone-200",
    "bg-amber-100",
    "bg-rose-100",
    "bg-emerald-100",
    "bg-sky-100",
  ],
};

const frames: Partial<Record<CollageTemplate["category"], string>> = {
  wedding: "#fbf5ef",
  love: "#fff1f2",
  holidays: "#7f1d1d",
  memories: "#f5f0e8",
  moodboard: "#f5f0e8",
};

const photos = (category: CollageTemplate["category"], ...numbers: number[]) =>
  numbers.map((n) => `/photos/${category}-${n}.jpg`);

type TemplateInput = Omit<CollageTemplate, "palette" | "photos"> &
  ({ shots: number[] } | { mix: string[] });

const input: TemplateInput[] = [
  {
    id: "city-lights",
    title: "City Lights",
    subtitle: "Париж · Венеция · Токио",
    description: "Пять городов на одном листе: главный кадр и детали маршрута.",
    category: "travel",
    layout: "mosaic",
    shots: [4, 8, 6, 10, 3],
  },
  {
    id: "summer-escape",
    title: "Summer Escape",
    subtitle: "Море и солнце",
    description: "Большой пляжный кадр и два воспоминания об отпуске.",
    category: "travel",
    layout: "heroLeft",
    shots: [5, 7, 1],
  },
  {
    id: "on-the-road",
    title: "On the Road",
    subtitle: "Новые маршруты",
    description: "Плёночная лента для сборов, перелётов и первых впечатлений.",
    category: "travel",
    layout: "film",
    shots: [2, 9, 8, 7],
  },
  {
    id: "party-time",
    title: "Party Time",
    subtitle: "С днём рождения!",
    description: "Шары, торт и подарки — праздничная мозаика из пяти кадров.",
    category: "birthday",
    layout: "mosaic",
    shots: [6, 1, 4, 3, 5],
  },
  {
    id: "sweet-wishes",
    title: "Sweet Wishes",
    subtitle: "Сладких пожеланий",
    description: "Открытка с крупным поздравлением и двумя деталями.",
    category: "birthday",
    layout: "heroTop",
    shots: [8, 7, 2],
  },
  {
    id: "gift-box",
    title: "Gift Box",
    subtitle: "Подарки и сюрпризы",
    description: "Триптих для подарков, свечей и первых минут праздника.",
    category: "birthday",
    layout: "strip",
    shots: [7, 1, 4],
  },
  {
    id: "everyday-joy",
    title: "Everyday Joy",
    subtitle: "Маленькие радости",
    description: "Четыре равных кадра для завтраков, прогулок и улыбок.",
    category: "memories",
    layout: "grid",
    shots: [7, 2, 3, 6],
  },
  {
    id: "golden-hour",
    title: "Golden Hour",
    subtitle: "Тёплые вечера",
    description: "Закатный главный кадр и два тихих момента.",
    category: "memories",
    layout: "heroLeft",
    shots: [4, 5, 1],
  },
  {
    id: "little-moments",
    title: "Little Moments",
    subtitle: "Запомнить всё",
    description: "Асимметричная «вертушка» из пяти снимков.",
    category: "memories",
    layout: "pinwheel",
    shots: [8, 9, 7, 2, 4],
  },
  {
    id: "weekend-trip",
    title: "Weekend Trip",
    subtitle: "Выходные с друзьями",
    description: "Походы и посиделки: один главный кадр и четыре истории.",
    category: "friends",
    layout: "mosaic",
    shots: [7, 6, 2, 8, 1],
  },
  {
    id: "photo-strip",
    title: "Photo Strip",
    subtitle: "Встречи и разговоры",
    description: "Три вертикальных кадра, как из фотобудки.",
    category: "friends",
    layout: "strip",
    shots: [8, 5, 4],
  },
  {
    id: "best-moments",
    title: "Best Moments",
    subtitle: "Лучшие моменты",
    description: "Широкий закат и два кадра из компании.",
    category: "friends",
    layout: "heroTop",
    shots: [1, 3, 6],
  },
  {
    id: "family-time",
    title: "Family Time",
    subtitle: "Наши выходные",
    description: "Журнальный разворот: центральный кадр и боковые колонки.",
    category: "family",
    layout: "feature",
    shots: [7, 2, 5, 4],
  },
  {
    id: "little-ones",
    title: "Little Ones",
    subtitle: "Как они растут",
    description: "Шесть кадров для детских улыбок и первых шагов.",
    category: "family",
    layout: "six",
    shots: [3, 2, 8, 6, 5, 1],
  },
  {
    id: "home-warmth",
    title: "Home Warmth",
    subtitle: "Дома лучше всего",
    description: "Спокойная сетка для семейного альбома.",
    category: "family",
    layout: "grid",
    shots: [6, 7, 8, 1],
  },
  {
    id: "two-hearts",
    title: "Two Hearts",
    subtitle: "Только мы",
    description: "Пять кадров о двоих в динамичной «вертушке».",
    category: "love",
    layout: "pinwheel",
    shots: [2, 5, 1, 3, 6],
  },
  {
    id: "love-story",
    title: "Love Story",
    subtitle: "Наша история",
    description: "Плёночная лента из четырёх моментов.",
    category: "love",
    layout: "film",
    shots: [3, 1, 2, 6],
  },
  {
    id: "together",
    title: "Together",
    subtitle: "Всегда рядом",
    description: "Главный кадр и две детали для открытки любимым.",
    category: "love",
    layout: "heroLeft",
    shots: [2, 3, 4],
  },
  {
    id: "big-day",
    title: "The Big Day",
    subtitle: "Наш главный день",
    description: "Торжественный кадр, руки и кольца.",
    category: "wedding",
    layout: "heroTop",
    shots: [7, 1, 8],
  },
  {
    id: "vows",
    title: "Vows & Rings",
    subtitle: "Навсегда вместе",
    description: "Классическая сетка для свадебного альбома.",
    category: "wedding",
    layout: "grid",
    shots: [8, 1, 6, 2],
  },
  {
    id: "celebration",
    title: "Celebration",
    subtitle: "Праздник любви",
    description: "Пара, декор и банкет в одной композиции.",
    category: "wedding",
    layout: "heroLeft",
    shots: [2, 3, 5],
  },
  {
    id: "winter-magic",
    title: "Winter Magic",
    subtitle: "Волшебство зимы",
    description: "Шесть кадров огней, ёлки и подарков.",
    category: "holidays",
    layout: "six",
    shots: [5, 3, 4, 2, 6, 1],
  },
  {
    id: "new-year",
    title: "New Year",
    subtitle: "С Новым годом!",
    description: "Журнальный разворот для новогодней открытки.",
    category: "holidays",
    layout: "feature",
    shots: [5, 1, 4, 6],
  },
  {
    id: "festive",
    title: "Festive",
    subtitle: "Праздничное настроение",
    description: "Крупная ёлка и две праздничные детали.",
    category: "holidays",
    layout: "heroTop",
    shots: [5, 3, 6],
  },
  {
    id: "forest-walk",
    title: "Forest Walk",
    subtitle: "Тишина леса",
    description: "Лес, мост и водопад: высокий главный кадр слева.",
    category: "nature",
    layout: "heroLeft",
    shots: [4, 5, 3],
  },
  {
    id: "mountain-views",
    title: "Mountain Views",
    subtitle: "Высоко в горах",
    description: "Горная мозаика для походов и путешествий.",
    category: "nature",
    layout: "mosaic",
    shots: [12, 7, 11, 2, 8],
  },
  {
    id: "seasons",
    title: "Four Seasons",
    subtitle: "Цветы и поля",
    description: "Четыре сезона в равной сетке.",
    category: "nature",
    layout: "grid",
    shots: [10, 9, 6, 1],
  },
  {
    id: "calm-mood",
    title: "Calm Mood",
    subtitle: "Тишина и свет",
    description:
      "Мудборд спокойных оттенков: туман, вода, цветы и утренний кофе.",
    category: "moodboard",
    layout: "six",
    mix: [
      "/photos/nature-8.jpg",
      "/photos/memories-1.jpg",
      "/photos/nature-6.jpg",
      "/photos/memories-7.jpg",
      "/photos/nature-1.jpg",
      "/photos/love-5.jpg",
    ],
  },
  {
    id: "inspiration",
    title: "Inspiration",
    subtitle: "Идеи на лето",
    description: "Доска вдохновения: сборы, дорога, цветы и города.",
    category: "moodboard",
    layout: "pinwheel",
    mix: [
      "/photos/travel-2.jpg",
      "/photos/memories-7.jpg",
      "/photos/travel-9.jpg",
      "/photos/nature-10.jpg",
      "/photos/memories-8.jpg",
    ],
  },
];

export const templates: CollageTemplate[] = input.map((entry) => {
  const { id, title, subtitle, description, category, layout } = entry;
  return {
    id,
    title,
    subtitle,
    description,
    category,
    layout,
    palette: palettes[category],
    photos: "mix" in entry ? entry.mix : photos(category, ...entry.shots),
  };
});

export function getTemplatesByCategory(slug: CategorySlug): CollageTemplate[] {
  return slug === "all"
    ? templates
    : templates.filter((t) => t.category === slug);
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
  {
    id: "sans",
    label: "Geist Sans",
    family: "var(--font-geist-sans), sans-serif",
  },
  {
    id: "display",
    label: "Playfair",
    family: "var(--font-playfair), Georgia, serif",
  },
  {
    id: "serif",
    label: "Georgia",
    family: "Georgia, 'Times New Roman', serif",
  },
  {
    id: "mono",
    label: "Geist Mono",
    family: "var(--font-geist-mono), monospace",
  },
  {
    id: "script",
    label: "Рукописный",
    family: "'Segoe Script', 'Brush Script MT', cursive",
  },
];

export function getFontFamily(id: FontId): string {
  return fontOptions.find((f) => f.id === id)?.family ?? fontOptions[0].family;
}

export const TEXT_REFERENCE_WIDTH = 768;

export function toCqw(px: number): string {
  return `${((px / TEXT_REFERENCE_WIDTH) * 100).toFixed(3)}cqw`;
}

export const getTextFontSize = toCqw;

export const TEXT_MAX_LENGTH = 160;

export function createText(
  id: string,
  patch: Partial<CollageText> = {},
): CollageText {
  return {
    id,
    text: "Новый текст",
    fontId: "sans",
    color: "#171717",
    size: 28,
    bold: false,
    x: 50,
    y: 50,
    background: true,
    ...patch,
  };
}

export function getDefaultStyle(template: CollageTemplate): CollageStyle {
  return {
    background: frames[template.category] ?? "#ffffff",
    gap: 8,
    radius: 8,
    aspect: "4/3",
  };
}

export const emptySlot = { src: "", x: 50, y: 50, zoom: 1 };

export function getInitialState(template: CollageTemplate): CollageState {
  return {
    layoutId: template.layout,
    photos: template.photos.map((src) => ({ ...emptySlot, src })),
    texts: [
      createText("title", {
        text: template.title,
        fontId: "display",
        size: 32,
        y: 10,
      }),
      createText("caption", {
        text: template.subtitle,
        fontId: "serif",
        color: "#525252",
        size: 18,
        y: 91,
      }),
    ],
    style: getDefaultStyle(template),
  };
}
