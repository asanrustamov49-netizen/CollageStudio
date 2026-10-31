"use client";
import Link from "next/link";
import { templates } from "@/data/templates";
import { useFavorites } from "@/store/favorites";
import { CatalogView } from "./CatalogView";
import { PopularTemplates } from "./PopularTemplates";
import { Icon } from "./ui/Icon";
import { ui } from "./ui/styles";

export function FavoritesView() {
  const favorites = useFavorites();
  const items = favorites
    ? templates.filter((t) => favorites.includes(t.id))
    : null;

  return (
    <div className="flex flex-1 flex-col bg-stone-950 text-stone-100">
      {items === null ? (
        <main className="flex-1 px-4 py-10 md:px-10">
          <div className="h-72 animate-pulse rounded-2xl bg-stone-900" />
        </main>
      ) : items.length === 0 ? (
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 md:px-10">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-stone-700 px-6 py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-stone-900 text-rose-400 ring-1 ring-stone-800">
              <Icon name="heart" className="size-7" />
            </span>
            <h1 className="font-display text-3xl">В избранном пусто</h1>
            <p className="max-w-sm text-sm text-stone-400">
              Нажмите на сердечко у шаблона — он появится здесь, чтобы вернуться
              к нему позже.
            </p>
            <Link href="/collages" className={ui.accent}>
              Открыть каталог
            </Link>
          </div>
          <PopularTemplates />
        </main>
      ) : (
        <CatalogView
          category="all"
          title="Избранное"
          items={items}
          showCategories={false}
        />
      )}
    </div>
  );
}
