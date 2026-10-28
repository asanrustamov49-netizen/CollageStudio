import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TemplateDetail } from "@/components/TemplateDetail";
import { getTemplateById, templates } from "@/data/templates";

type Params = PageProps<"/templates/[id]">["params"];

export function generateStaticParams() {
  return templates.map((t) => ({ id: t.id }));
}

async function TemplateContent({ params }: { params: Params }) {
  const { id } = await params;
  const template = getTemplateById(id);
  if (!template) notFound();
  return <TemplateDetail template={template} />;
}

export default function TemplatePage({ params }: PageProps<"/templates/[id]">) {
  return (
    <Suspense fallback={<p className="m-auto py-20 text-sm text-stone-400">Загрузка шаблона…</p>}>
      <TemplateContent params={params} />
    </Suspense>
  );
}
