"use client";

import Link from "next/link";
import { ToastList, useToasts } from "@/components/editor/Toasts";
import { PageHeader } from "@/components/shell/PageHeader";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { useProjects } from "@/store/projects";
import { MyGifts } from "./MyGifts";

const steps: { icon: IconName; title: string; text: string }[] = [
  { icon: "folder", title: "Откройте проект", text: "Соберите коллаж и нажмите «Подарок» в редакторе." },
  { icon: "type", title: "Напишите послание", text: "Имя получателя, пара тёплых слов и музыка — из библиотеки или своя песня." },
  { icon: "grid", title: "Отправьте QR или ссылку", text: "Распечатайте QR-код для открытки или поделитесь ссылкой в мессенджере." },
];

export function GiftsView({ demoHref }: { demoHref: string }) {
  const projects = useProjects();
  const { toasts, notify } = useToasts();
  const latest = projects?.length ? [...projects].sort((a, b) => b.updatedAt - a.updatedAt)[0] : null;

  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 flex-1 space-y-10 px-4 py-6 md:px-10 md:py-10">
      <PageHeader
        eyebrow="Подарки с QR-кодом"
        title="Подарки"
        subtitle="Страница-сюрприз с конвертом, вашим сообщением, коллажем, галереей и музыкой. Получателю не нужен аккаунт."
        actions={
          <>
            <a href={demoHref} target="_blank" rel="noreferrer" className={ui.darkSecondary}>
              <Icon name="eye" className="size-4" /> Пример
            </a>
            <Link href={latest ? `/projects/${latest.id}` : "/collages"} className={ui.accent}>
              <Icon name="gift" className="size-4" /> {latest ? "Подарить последний проект" : "Выбрать шаблон"}
            </Link>
          </>
        }
      />

      <ol className="grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-2xl bg-stone-900 p-5 ring-1 ring-stone-800">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-300 text-stone-950">
                <Icon name={s.icon} />
              </span>
              <span className="font-mono text-sm text-stone-500">0{i + 1}</span>
            </div>
            <h2 className="mt-4 font-display text-xl">{s.title}</h2>
            <p className="mt-1 text-sm text-stone-400">{s.text}</p>
          </li>
        ))}
      </ol>

      <section aria-labelledby="my-gifts">
        <h2 id="my-gifts" className="mb-4 font-display text-2xl">Мои подарки</h2>
        <MyGifts notify={notify} />
      </section>
      <ToastList toasts={toasts} />
    </main>
  );
}
