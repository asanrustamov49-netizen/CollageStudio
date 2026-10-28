import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";
import { ui } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 bg-stone-950 px-6 py-20 text-center text-stone-100">
      <LogoMark className="size-16" />
      <p className="font-mono text-sm text-stone-500">Ошибка 404</p>
      <h1 className="font-display text-4xl md:text-5xl">Такой страницы нет</h1>
      <p className="max-w-sm text-stone-400">Возможно, ссылка устарела или в ней опечатка. Начните с каталога или откройте свои проекты.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/collages" className={ui.accent}>Каталог шаблонов</Link>
        <Link href="/projects" className={ui.darkSecondary}>Мои проекты</Link>
        <Link href="/" className={ui.darkSecondary}>На главную</Link>
      </div>
    </main>
  );
}
