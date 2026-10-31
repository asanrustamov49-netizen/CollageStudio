"use client";
import { useState } from "react";
import { toggleFavorite, useFavorites } from "@/store/favorites";

export function FavoriteButton({
  templateId,
  title,
  className = "",
}: {
  templateId: string;
  title: string;
  className?: string;
}) {
  const favorites = useFavorites();
  const [error, setError] = useState(false);
  const active = favorites?.includes(templateId) ?? false;

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={
        active
          ? `Убрать «${title}» из избранного`
          : `Добавить «${title}» в избранное`
      }
      title={
        error
          ? "Не удалось сохранить в аккаунт — попробуйте ещё раз"
          : active
            ? "В избранном"
            : "В избранное"
      }
      onClick={async (e) => {
        e.preventDefault();
        setError(!(await toggleFavorite(templateId)));
      }}
      className={`inline-flex size-11 items-center justify-center rounded-full backdrop-blur transition-colors ${
        active
          ? "bg-rose-500 text-white"
          : "bg-stone-950/70 text-white hover:bg-stone-950"
      } ${error ? "ring-2 ring-red-500" : ""} ${className}`}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-5"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      >
        <path d="M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11z" />
      </svg>
    </button>
  );
}
