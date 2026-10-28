import type { ReactNode } from "react";

/** Заголовок страницы платформы: единые размеры и отступы во всех разделах. */
export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-800 pb-6">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-xs tracking-[0.2em] text-amber-300 uppercase">{eyebrow}</p>}
        <h1 className="truncate font-display text-3xl md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-stone-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
