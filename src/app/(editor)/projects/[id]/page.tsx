import { Suspense } from "react";
import { ProjectEditor } from "@/components/editor/CollageEditor";

type Params = PageProps<"/projects/[id]">["params"];

async function EditorContent({ params }: { params: Params }) {
  const { id } = await params;
  return <ProjectEditor projectId={id} />;
}

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <Suspense fallback={<p className="m-auto py-20 text-sm text-stone-400">Загрузка редактора…</p>}>
      <EditorContent params={params} />
    </Suspense>
  );
}
