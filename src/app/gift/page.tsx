import type { Metadata } from "next";
import { GiftView } from "@/components/gift/GiftView";

export const metadata: Metadata = { title: "Вам подарок", robots: { index: false } };

export default function GiftPage() {
  return <GiftView />;
}
