import type { Metadata } from "next";
import { Suspense } from "react";
import { PublishedGift } from "@/components/gift/GiftView";

export const metadata: Metadata = { title: "Вам подарок", robots: { index: false } };

type Params = PageProps<"/g/[id]">["params"];

async function GiftContent({ params }: { params: Params }) {
  const { id } = await params;
  return <PublishedGift id={id} />;
}

export default function PublishedGiftPage({ params }: PageProps<"/g/[id]">) {
  return (
    <Suspense fallback={<p className="m-auto py-20 text-sm text-stone-400">Открываем подарок…</p>}>
      <GiftContent params={params} />
    </Suspense>
  );
}
