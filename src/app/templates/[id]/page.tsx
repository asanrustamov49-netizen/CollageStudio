import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CollageEditor } from "@/components/editor/CollageEditor";
import { getTemplateById, templates } from "@/data/templates";

type Params = PageProps<"/templates/[id]">["params"];

export function generateStaticParams() {
  return templates.map((t) => ({ id: t.id }));
}

async function EditorContent({ params }: { params: Params }) {
  const { id } = await params;
  const template = getTemplateById(id);
  if (!template) notFound();
  return <CollageEditor template={template} />;
}

export default function TemplatePage({ params }: PageProps<"/templates/[id]">) {
  return (
    <Suspense
      fallback={<p className="m-auto py-20 text-sm text-neutral-500">Загрузка редактора…</p>}
    >
      <EditorContent params={params} />
    </Suspense>
  );
}
