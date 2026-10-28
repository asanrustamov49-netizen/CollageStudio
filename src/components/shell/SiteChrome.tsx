"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AccountButton } from "@/components/account/AccountBits";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { ui } from "@/components/ui/styles";
import { categories, getCategoryHref } from "@/data/templates";

const links = [
  { href: "/collages", label: "Каталог" },
  { href: "/ideas", label: "Идеи" },
  { href: "/gifts", label: "Подарки" },
  { href: "/guide", label: "Как это работает" },
  { href: "/help", label: "Помощь" },
];

function NavLinks({ path, onNavigate, vertical = false }: { path: string; onNavigate?: () => void; vertical?: boolean }) {
  return (
    <ul className={vertical ? "space-y-1" : "flex items-center gap-1"}>
      {links.map((l) => {
        const active = path.startsWith(l.href);
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm transition-colors ${vertical ? "w-full text-base" : ""} ${
                active ? "bg-stone-800 text-white" : "text-stone-400 hover:text-stone-100"
              }`}
            >
              {l.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function PathNav(props: { onNavigate?: () => void; vertical?: boolean }) {
  return <NavLinks path={usePathname()} {...props} />;
}

/** Шапка публичных страниц: логотип, разделы, аккаунт; на телефоне — выпадающее меню. */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-800/70 bg-stone-950/85 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-8">
        <Link href="/" aria-label="Collage Studio — на главную">
          <Logo />
        </Link>
        <nav aria-label="Основное" className="hidden lg:block">
          <Suspense fallback={<NavLinks path="" />}>
            <PathNav />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <AccountButton compact />
          </div>
          <div className="hidden sm:block">
            <Link href="/collages" className={`${ui.accent} rounded-full`}>
              Создать коллаж
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            className="inline-flex size-11 items-center justify-center rounded-full text-stone-200 hover:bg-stone-800 lg:hidden"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
      {open && (
        <div id="site-menu" className="animate-fade border-t border-stone-800 px-4 pt-3 pb-5 lg:hidden">
          <Suspense fallback={<NavLinks path="" vertical onNavigate={() => setOpen(false)} />}>
            <PathNav vertical onNavigate={() => setOpen(false)} />
          </Suspense>
          <div className="mt-4 grid gap-2 sm:hidden">
            <Link href="/collages" onClick={() => setOpen(false)} className={`${ui.accent} w-full`}>
              Создать коллаж
            </Link>
            <Link href="/projects" onClick={() => setOpen(false)} className={`${ui.darkSecondary} w-full`}>
              Мои проекты
            </Link>
            <Link href="/account" onClick={() => setOpen(false)} className={`${ui.darkSecondary} w-full`}>
              Профиль
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const year = 2026;
  const columns = [
    { title: "Платформа", items: [["/collages", "Каталог шаблонов"], ["/ideas", "Идеи и подборки"], ["/gifts", "Подарки с QR"], ["/projects", "Мои проекты"]] },
    { title: "Помощь", items: [["/guide", "Как это работает"], ["/help", "Вопросы и ответы"], ["/privacy", "Конфиденциальность"]] },
    { title: "Аккаунт", items: [["/login", "Войти"], ["/register", "Регистрация"], ["/favorites", "Избранное"]] },
  ];
  return (
    <footer className="border-t border-stone-800/70 bg-[#0e0b0a] px-4 pt-12 pb-[calc(2rem+env(safe-area-inset-bottom))] text-sm md:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-stone-500">Готовые фотоколлажи для печати и подарки-сюрпризы с QR-кодом. Начните без регистрации.</p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <p className="text-xs tracking-[0.16em] text-stone-500 uppercase">{c.title}</p>
            <ul className="mt-3 space-y-2">
              {c.items.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-stone-300 hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap gap-x-4 gap-y-2 border-t border-stone-800/70 pt-6 text-xs text-stone-500">
        <span>© {year} Collage Studio</span>
        <span>Демонстрационные фото — Unsplash License</span>
        <span className="flex flex-wrap gap-x-3">
          {categories
            .filter((c) => c.slug !== "all")
            .slice(0, 6)
            .map((c) => (
              <Link key={c.slug} href={getCategoryHref(c.slug)} className="hover:text-stone-300">
                {c.label}
              </Link>
            ))}
        </span>
      </div>
    </footer>
  );
}
