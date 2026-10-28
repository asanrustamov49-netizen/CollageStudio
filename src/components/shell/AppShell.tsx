"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { TRACKS } from "@/components/music/ambientMusic";
import { Equalizer, useMusic } from "@/components/music/MusicProvider";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { ui } from "@/components/ui/styles";
import { useAccount } from "@/store/account";
import { useFavorites } from "@/store/favorites";
import { useProjects } from "@/store/projects";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  match: (path: string) => boolean;
  count?: "projects" | "favorites";
}

const primary: NavItem[] = [
  { href: "/", label: "Главная", icon: "home", match: (p) => p === "/" },
  { href: "/collages", label: "Каталог шаблонов", icon: "grid", match: (p) => p.startsWith("/collages") || p.startsWith("/templates") },
  { href: "/projects", label: "Мои проекты", icon: "folder", match: (p) => p.startsWith("/projects"), count: "projects" },
  { href: "/favorites", label: "Избранное", icon: "heart", match: (p) => p.startsWith("/favorites"), count: "favorites" },
  { href: "/gifts", label: "Подарки", icon: "gift", match: (p) => p.startsWith("/gifts") },
  { href: "/ideas", label: "Идеи", icon: "sparkle", match: (p) => p.startsWith("/ideas") },
];

const secondary: NavItem[] = [
  { href: "/guide", label: "Как это работает", icon: "book", match: (p) => p.startsWith("/guide") },
  { href: "/help", label: "Помощь", icon: "help", match: (p) => p.startsWith("/help") },
];

const tabs: NavItem[] = [
  { href: "/collages", label: "Каталог", icon: "grid", match: primary[1].match },
  { href: "/projects", label: "Проекты", icon: "folder", match: primary[2].match },
  { href: "/favorites", label: "Избранное", icon: "heart", match: primary[3].match },
  { href: "/gifts", label: "Подарки", icon: "gift", match: primary[4].match },
  { href: "/account", label: "Профиль", icon: "user", match: (p) => p.startsWith("/account") || p.startsWith("/login") },
];

/** Адрес текущей страницы. Читается внутри <Suspense>, пока его нет — ничего не подсвечено. */
function WithPath({ children }: { children: (path: string) => ReactNode }) {
  return <Suspense fallback={children("")}><PathReader>{children}</PathReader></Suspense>;
}

function PathReader({ children }: { children: (path: string) => ReactNode }) {
  return children(usePathname());
}

function Counter({ kind }: { kind: NonNullable<NavItem["count"]> }) {
  const projects = useProjects();
  const favorites = useFavorites();
  const value = kind === "projects" ? projects?.length : favorites?.length;
  if (!value) return null;
  return <span className="ml-auto rounded-md bg-stone-800 px-1.5 text-[11px] leading-5 text-stone-400 tabular-nums">{value}</span>;
}

function NavList({ items, path, onNavigate }: { items: NavItem[]; path: string; onNavigate?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = item.match(path);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                active ? "bg-stone-800 font-medium text-white" : "text-stone-400 hover:bg-stone-900 hover:text-stone-100"
              }`}
            >
              <Icon name={item.icon} className={`size-[18px] ${active ? "text-amber-300" : ""}`} />
              {item.label}
              {item.count && <Counter kind={item.count} />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Компактный плеер фоновой музыки: одна строка, настроение и громкость — по кнопке. */
export function MiniPlayer() {
  const { playing, track, volume, error, toggle, selectTrack, setVolume } = useMusic();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-stone-900 p-2 ring-1 ring-stone-800">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Пауза" : "Включить фоновую музыку"}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-300 text-stone-950 hover:bg-amber-200"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="size-4" fill="currentColor">
            {playing ? <path d="M6 4h3v12H6zM11 4h3v12h-3z" /> : <path d="M7 4.5v11l9-5.5z" />}
          </svg>
        </button>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm text-stone-100">{track.title}</p>
          <p className="truncate text-[11px] text-stone-500">{playing ? track.mood : "Фоновая музыка"}</p>
        </div>
        <Equalizer playing={playing} bars={4} className="h-3.5 text-amber-300" />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Настроение и громкость"
          className="flex size-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white"
        >
          <Icon name="sliders" className="size-4" />
        </button>
      </div>
      {open && (
        <div className="mt-2 animate-fade space-y-2 border-t border-stone-800 pt-2">
          <div role="radiogroup" aria-label="Настроение музыки" className="grid grid-cols-3 gap-1">
            {TRACKS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={t.id === track.id}
                onClick={() => selectTrack(t.id)}
                className={`min-h-8 rounded-md text-xs ${t.id === track.id ? "bg-amber-300 font-semibold text-stone-950" : "bg-stone-800 text-stone-300 hover:bg-stone-700"}`}
              >
                {t.title}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 px-1 text-stone-500">
            <Icon name="music" className="size-3.5" />
            <span className="sr-only">Громкость</span>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="h-6 w-full accent-amber-300" />
          </label>
        </div>
      )}
      {error && <p role="alert" className="mt-1 px-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

/** Карточка аккаунта внизу сайдбара. */
function AccountCard({ onNavigate }: { onNavigate?: () => void }) {
  const account = useAccount();
  if (account.status === "loading") return <div className="h-12 animate-pulse rounded-xl bg-stone-900" aria-hidden />;
  if (account.status === "guest") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Link href="/login" onClick={onNavigate} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-stone-700 text-sm text-stone-200 hover:bg-stone-900">
          Войти
        </Link>
        <Link href="/register" onClick={onNavigate} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-stone-100 text-sm font-medium text-stone-950 hover:bg-white">
          Регистрация
        </Link>
      </div>
    );
  }
  return (
    <Link href="/account" onClick={onNavigate} className="flex items-center gap-3 rounded-xl p-2 hover:bg-stone-900">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-300 font-semibold text-stone-950">{account.user.name.slice(0, 1).toUpperCase()}</span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-sm text-stone-100">{account.user.name}</span>
        <span className="block truncate text-[11px] text-stone-500">{account.sync === "error" ? "Ошибка синхронизации" : account.user.email}</span>
      </span>
      <Icon name="right" className="size-4 text-stone-500" />
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <Link href="/" onClick={onNavigate} aria-label="Collage Studio — на главную">
          <Logo markClassName="size-8" />
        </Link>
      </div>
      <div className="px-3">
        <Link href="/collages" onClick={onNavigate} className={`${ui.accent} w-full`}>
          <Icon name="plus" className="size-4" /> Создать коллаж
        </Link>
      </div>
      <nav aria-label="Разделы" className="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto px-3">
        <WithPath>{(path) => <NavList items={primary} path={path} onNavigate={onNavigate} />}</WithPath>
        <p className="mt-6 mb-1.5 px-3 text-[11px] tracking-[0.16em] text-stone-600 uppercase">Поддержка</p>
        <WithPath>{(path) => <NavList items={secondary} path={path} onNavigate={onNavigate} />}</WithPath>
      </nav>
      <div className="space-y-2 border-t border-stone-800/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <MiniPlayer />
        <AccountCard onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/**
 * Оболочка разделов платформы: сайдбар на широких экранах;
 * на телефоне — верхняя панель, меню и нижние вкладки.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const music = useMusic();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex flex-1 bg-stone-950 text-stone-100">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-stone-800/80 bg-[#100d0b] lg:block">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-stone-800/80 bg-stone-950/90 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur lg:hidden">
          <Link href="/" aria-label="Collage Studio — на главную" className="mr-auto">
            <Logo markClassName="size-7" />
          </Link>
          <button
            type="button"
            onClick={music.toggle}
            aria-pressed={music.playing}
            aria-label={music.playing ? "Выключить музыку" : "Включить фоновую музыку"}
            className="inline-flex size-11 items-center justify-center rounded-full text-stone-300 hover:bg-stone-800"
          >
            {music.playing ? <Equalizer playing className="text-amber-300" bars={3} /> : <Icon name="music" />}
          </button>
          <button type="button" onClick={() => setOpen(true)} aria-label="Открыть меню" aria-expanded={open} className="inline-flex size-11 items-center justify-center rounded-full text-stone-200 hover:bg-stone-800">
            <Icon name="menu" />
          </button>
        </header>
        <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</div>
      </div>

      <nav aria-label="Основные разделы" className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-800 bg-stone-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <WithPath>
          {(path) => (
            <ul className="grid grid-cols-5">
              {tabs.map((t) => {
                const active = t.match(path);
                return (
                  <li key={t.href}>
                    <Link href={t.href} aria-current={active ? "page" : undefined} className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] ${active ? "text-amber-300" : "text-stone-400"}`}>
                      <Icon name={t.icon} className="size-5" />
                      {t.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </WithPath>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Меню">
          <div aria-hidden onClick={() => setOpen(false)} className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-sm" />
          <div className="absolute inset-y-0 left-0 w-[min(19rem,86vw)] animate-drawer border-r border-stone-800 bg-[#100d0b] pt-[env(safe-area-inset-top)] shadow-2xl motion-reduce:animate-none">
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть меню" className="absolute top-[max(1rem,env(safe-area-inset-top))] right-3 inline-flex size-10 items-center justify-center rounded-full text-stone-400 hover:bg-stone-800">
              <Icon name="close" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

