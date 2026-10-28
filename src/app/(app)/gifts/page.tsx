import type { Metadata } from "next";
import { GiftsView } from "@/components/gift/GiftsView";
import { getInitialState, getTemplateById } from "@/data/templates";
import { encodeGiftPlain, giftPath } from "@/lib/gift";

export const metadata: Metadata = { title: "Подарки" };

const demoTemplate = getTemplateById("two-hearts")!;
const demo = giftPath(
  encodeGiftPlain({
    templateId: demoTemplate.id,
    to: "Саша",
    message: "Год назад мы впервые встретились. Вот наши самые тёплые кадры — с годовщиной!",
    track: "dawn",
    state: getInitialState(demoTemplate),
  }),
);

export default function GiftsPage() {
  return <GiftsView demoHref={demo} />;
}
