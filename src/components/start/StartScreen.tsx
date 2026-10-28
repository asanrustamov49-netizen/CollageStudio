import Link from "next/link";
import { TemplatePreview } from "@/components/TemplatePreview";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { categories, getCategoryHref, getInitialState, getTemplateById, templates } from "@/data/templates";
import { encodeGiftPlain, giftPath } from "@/lib/gift";
import type { CollageTemplate } from "@/types/collage";
import { HeroStack } from "./HeroStack";

const pick = (ids: string[]) => ids.map(getTemplateById).filter((t): t is CollageTemplate => Boolean(t));
const showcase = pick(["mountain-views", "big-day", "party-time"]);
const examples = pick(["city-lights", "two-hearts", "little-ones", "winter-magic"]);
const demoTemplate = getTemplateById("summer-escape")!;

/** Готовый пример подарка: настоящая ссылка на страницу получателя. */
const demoGift = giftPath(
  encodeGiftPlain({
    templateId: demoTemplate.id,
    to: "Алина",
    message: "Помнишь это лето? Собрал наши лучшие кадры — пусть греют до следующего отпуска.",
    track: "summer",
    state: getInitialState(demoTemplate),
  }),
);

const steps: { icon: IconName; title: string; text: string }[] = [
  { icon: "grid", title: "Выберите шаблон", text: `${templates.length} композиций для путешествий, праздников и будней — от плёнки до журнального разворота.` },
  { icon: "image", title: "Добавьте свои фото", text: "Нажмите на ячейку или перетащите снимки. Кадр, подписи, цвета и макет меняются в пару касаний." },
  { icon: "gift", title: "Скачайте или подарите", text: "PNG, JPG и PDF для печати — или страница-сюрприз со ссылкой и QR-кодом для близкого человека." },
];

const features: { icon: IconName; title: string; text: string }[] = [
  { icon: "layout", title: "9 макетов", text: "От сетки и плёнки до журнального разворота. Фото не теряются при смене макета." },
  { icon: "printer", title: "Готово к печати", text: "PNG, JPG и PDF до 3600 px с предпросмотром итогового файла." },
  { icon: "gift", title: "Подарок с QR", text: "Страница-сюрприз с конвертом, галереей и вашим посланием." },
  { icon: "music", title: "Музыка и песни", text: "Три настроения фоновой музыки или своя песня в подарке." },
  { icon: "folder", title: "С любого устройства", text: "С аккаунтом проекты и избранное синхронизируются сами." },
  { icon: "image", title: "Удобно с телефона", text: "Нижняя панель, шторка настроек и перетаскивание пальцем." },
];

export function StartScreen() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-stone-950 text-stone-100">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(252,211,77,0.14),transparent)]" />

      <main className="relative z-10">
        <section className="flex flex-col items-center px-4 pt-8 pb-16 text-center md:px-10">
          <p className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-1 text-xs tracking-[0.2em] text-amber-200 uppercase">
            Коллажи и подарки с QR-кодом
          </p>
          <h1 className="mt-6 max-w-4xl font-display text-[2.6rem] leading-[1.05] text-balance sm:text-7xl">
            Ваши моменты&nbsp;— <em className="text-amber-300">в одном кадре</em>
          </h1>
          <p className="mt-6 max-w-xl text-base text-pretty text-stone-400">
            Готовые композиции с фотографиями: замените снимки своими, подпишите, скачайте для печати или подарите по ссылке.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={getCategoryHref("all")} className={`${ui.accent} rounded-full px-7`}>
              Выбрать шаблон →
            </Link>
            <Link href={demoGift} className={`${ui.darkSecondary} rounded-full px-6`}>
              <Icon name="gift" className="size-4" /> Пример подарка
            </Link>
          </div>
          {showcase.length > 0 && <HeroStack templates={showcase} />}
        </section>

        <section aria-labelledby="how" className="border-t border-stone-900 bg-stone-900/40 px-4 py-16 md:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 id="how" className="font-display text-3xl sm:text-4xl">Три шага до готовой истории</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="rounded-2xl bg-stone-900 p-6 ring-1 ring-stone-800">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-amber-300 text-stone-950">
                      <Icon name={s.icon} />
                    </span>
                    <span className="font-mono text-sm text-stone-500">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-display text-xl">{s.title}</h3>
                  <p className="mt-2 text-sm text-stone-400">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="gift" className="px-4 py-16 md:px-10">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs tracking-[0.2em] text-amber-300 uppercase">Подарок с QR-кодом</p>
              <h2 id="gift" className="mt-3 font-display text-3xl sm:text-4xl">Воспоминания, которые можно подарить</h2>
              <ul className="mt-6 space-y-3 text-stone-300">
                {["Конверт, который открывается по нажатию, и ваше сообщение", "Коллаж и галерея с перелистыванием на весь экран", "Музыка по кнопке — без внезапного звука", "Получателю не нужен аккаунт: достаточно ссылки или камеры"].map((t) => (
                  <li key={t} className="flex gap-3">
                    <Icon name="check" className="size-5 text-amber-300" /> {t}
                  </li>
                ))}
              </ul>
              <Link href={demoGift} className={`${ui.accent} mt-8 rounded-full px-6`}>
                Открыть пример подарка
              </Link>
            </div>
            <Link href={demoGift} aria-label="Открыть пример подарка" className="group relative mx-auto block w-full max-w-md">
              <div className="rotate-2 overflow-hidden rounded-2xl shadow-2xl ring-1 shadow-black/60 ring-stone-800 transition-transform duration-500 group-hover:rotate-0 motion-reduce:transition-none">
                <TemplatePreview template={demoTemplate} state={getInitialState(demoTemplate)} sizes="(min-width: 1024px) 28rem, 90vw" />
              </div>
              <span className="absolute -bottom-5 left-6 rounded-2xl bg-amber-100 px-4 py-3 font-display text-stone-900 italic shadow-xl">Для Алины ♡</span>
            </Link>
          </div>
        </section>

        <section aria-labelledby="features" className="border-t border-stone-900 px-4 py-16 md:px-10">
          <div className="mx-auto max-w-6xl">
            <h2 id="features" className="font-display text-3xl sm:text-4xl">Всё для коллажа — в одном месте</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <li key={f.title} className="flex gap-4 rounded-2xl p-5 ring-1 ring-stone-800">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-amber-300 ring-1 ring-stone-800">
                    <Icon name={f.icon} />
                  </span>
                  <span>
                    <span className="block font-display text-lg">{f.title}</span>
                    <span className="mt-1 block text-sm text-stone-400">{f.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="themes" className="border-t border-stone-900 px-4 py-16 md:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="themes" className="font-display text-3xl sm:text-4xl">У каждого повода — своя история</h2>
              <Link href={getCategoryHref("all")} className="text-sm text-amber-300 hover:underline">
                Весь каталог →
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {examples.map((t) => (
                <li key={t.id}>
                  <Link href={`/templates/${t.id}`} className="block overflow-hidden rounded-xl ring-1 ring-stone-800 hover:ring-amber-300/60">
                    <TemplatePreview template={t} state={getInitialState(t)} sizes="(min-width: 640px) 25vw, 50vw" />
                    <span className="block bg-stone-900 px-3 py-2 text-sm">{t.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Темы">
              {categories
                .filter((c) => c.slug !== "all")
                .map((c) => (
                  <li key={c.slug}>
                    <Link href={getCategoryHref(c.slug)} className="inline-flex min-h-11 items-center rounded-full border border-stone-800 bg-stone-900 px-4 text-sm text-stone-300 hover:border-amber-300/60 hover:text-amber-200">
                      {c.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-10">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-amber-300 px-6 py-12 text-center text-stone-950 sm:px-12">
            <h2 className="font-display text-3xl text-balance sm:text-5xl">Первый коллаж — за пару минут</h2>
            <p className="mx-auto mt-3 max-w-xl text-stone-800">Без регистрации: выберите шаблон, замените фото и скачайте результат.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href={getCategoryHref("all")} className="inline-flex min-h-12 items-center rounded-full bg-stone-950 px-7 text-sm font-semibold text-white hover:bg-stone-800">
                Открыть каталог
              </Link>
              <Link href="/ideas" className="inline-flex min-h-12 items-center rounded-full border border-stone-950/30 px-7 text-sm font-semibold hover:bg-amber-200">
                Посмотреть идеи
              </Link>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
