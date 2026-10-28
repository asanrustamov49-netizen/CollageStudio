"use client";

import Link from "next/link";
import { templates } from "@/data/templates";
import { useFavorites } from "@/store/favorites";
import { CatalogView } from "./CatalogView";
import { Icon } from "./ui/Icon";
import { ui } from "./ui/styles";

export function FavoritesView() {
  const favorites = useFavorites();
  const items = favorites ? templates.filter((t) => favorites.includes(t.id)) : null;

  return (
    <div className="flex flex-1 flex-col bg-stone-950 text-stone-100">
      {items === null ? (
        <main className="flex-1 px-4 py-10 md:px-10">
          <div className="h-72 animate-pulse rounded-2xl bg-stone-900" />
        </main>
      ) : items.length === 0 ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <Icon name="heart" className="size-10 text-stone-600" />
          <h1 className="font-display text-3xl">В избранном пусто</h1>
          <p className="max-w-sm text-sm text-stone-400">Нажмите на сердечко у шаблона в каталоге — он появится здесь.</p>
          <Link href="/collages" className={ui.accent}>
            Открыть каталог
          </Link>
        </main>
      ) : (
        <CatalogView category="all" title="Избранное" items={items} showCategories={false} />
      )}
    </div>
  );
}
