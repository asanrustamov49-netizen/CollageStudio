import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Конфиденциальность", description: "Какие данные хранит Collage Studio, где и как их удалить." };

const sections: { icon: IconName; title: string; items: string[] }[] = [
  {
    icon: "folder",
    title: "Без аккаунта",
    items: [
      "Проекты, избранное и настройки хранятся только в вашем браузере (localStorage и IndexedDB).",
      "Свои фото не отправляются на сервер.",
      "Подарок без аккаунта целиком записан в ссылке после знака # — сервер его не получает.",
    ],
  },
  {
    icon: "user",
    title: "С аккаунтом",
    items: [
      "Храним имя, email, хеш пароля (scrypt с солью — сам пароль не хранится), проекты, избранное, подарки и загруженные файлы.",
      "Вход держится на cookie сессии, недоступной скриптам страницы (httpOnly). В базе лежит только хеш токена.",
      "Проекты видит только владелец: сервер проверяет права при каждом запросе.",
    ],
  },
  {
    icon: "gift",
    title: "Подарки и файлы",
    items: [
      "Опубликованный подарок открывается по ссылке без входа — для этого он и создаётся.",
      "Фото и песни из аккаунта открываются по длинным случайным адресам; они не публикуются в каталоге и поиске.",
      "Удалённый подарок перестаёт открываться сразу.",
    ],
  },
  {
    icon: "trash",
    title: "Как удалить данные",
    items: [
      "Проект — кнопка удаления в «Моих проектах».",
      "Подарок — в разделе «Подарки» или в профиле.",
      "Всё сразу — «Удалить аккаунт» в профиле: удаляются проекты, подарки и все файлы.",
      "Данные без аккаунта стираются вместе с данными сайта в настройках браузера.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="flex-1 px-4 py-14 md:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs tracking-[0.2em] text-amber-300 uppercase">Конфиденциальность</p>
        <h1 className="mt-3 font-display text-4xl md:text-6xl">Ваши фото — ваши</h1>
        <p className="mt-4 text-stone-400">Коротко и по делу: что мы храним, где и как это удалить. Рекламы и сторонних трекеров на сайте нет.</p>
        <div className="mt-10 space-y-5">
          {sections.map((s) => (
            <section key={s.title} className="rounded-2xl bg-stone-900 p-6 ring-1 ring-stone-800">
              <h2 className="flex items-center gap-3 font-display text-2xl">
                <span className="flex size-10 items-center justify-center rounded-xl bg-stone-800 text-amber-300">
                  <Icon name={s.icon} />
                </span>
                {s.title}
              </h2>
              <ul className="mt-4 space-y-2.5 text-sm text-stone-300">
                {s.items.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Icon name="check" className="mt-0.5 size-4 text-amber-300" /> {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
