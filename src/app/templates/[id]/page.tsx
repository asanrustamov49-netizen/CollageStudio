import { notFound } from "next/navigation";
import { CollageEditor } from "@/components/editor/CollageEditor";
import { getTemplateById, templates } from "@/data/templates";

export function generateStaticParams() {
  return templates.map((t) => ({ id: t.id }));
}

export default async function TemplatePage({ params }: PageProps<"/templates/[id]">) {
  const { id } = await params;
  const template = getTemplateById(id);
  if (!template) notFound();
  return <CollageEditor template={template} />;
}
