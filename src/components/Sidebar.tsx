import Link from "next/link";
import { categories, getCategoryHref } from "@/data/templates";
import type { CategorySlug } from "@/types/collage";

export function Sidebar({ active }: { active: CategorySlug }) {
  return (
    <aside className="border-b border-neutral-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <div className="px-4 pt-5 pb-3 md:px-6 md:pt-8 md:pb-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-neutral-900">
          Collage Studio
        </Link>
      </div>
      <nav aria-label="Категории">
        <ul className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3">
          {categories.map((category) => {
            const isActive = category.slug === active;
            return (
              <li key={category.slug} className="shrink-0">
                <Link
                  href={getCategoryHref(category.slug)}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  {category.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
