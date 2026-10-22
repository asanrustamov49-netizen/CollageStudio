import { notFound } from "next/navigation";
import { TemplateCatalog } from "@/components/TemplateCatalog";
import { categories, isCategorySlug } from "@/data/templates";

export function generateStaticParams() {
  return categories.filter((c) => c.slug !== "all").map((c) => ({ category: c.slug }));
}

export default async function CategoryPage({ params }: PageProps<"/collages/[category]">) {
  const { category } = await params;
  if (!isCategorySlug(category) || category === "all") notFound();
  return <TemplateCatalog category={category} />;
}
