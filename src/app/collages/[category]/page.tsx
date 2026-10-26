import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TemplateCatalog } from "@/components/TemplateCatalog";
import { categories, isCategorySlug } from "@/data/templates";

type Params = PageProps<"/collages/[category]">["params"];

export function generateStaticParams() {
  return categories.filter((c) => c.slug !== "all").map((c) => ({ category: c.slug }));
}

async function CategoryContent({ params }: { params: Params }) {
  const { category } = await params;
  if (!isCategorySlug(category) || category === "all") notFound();
  return <TemplateCatalog category={category} />;
}

export default function CategoryPage({ params }: PageProps<"/collages/[category]">) {
  return (
    <Suspense
      fallback={<p className="m-auto py-20 text-sm text-neutral-500">Загрузка каталога…</p>}
    >
      <CategoryContent params={params} />
    </Suspense>
  );
}
