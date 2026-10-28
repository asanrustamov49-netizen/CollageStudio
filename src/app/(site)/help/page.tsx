import type { Metadata } from "next";
import { HelpView } from "@/components/HelpView";

export const metadata: Metadata = {
  title: "Помощь",
  description: "Ответы на частые вопросы: сохранение проектов, фото, экспорт и печать, подарки с QR-кодом, аккаунт.",
};

export default function HelpPage() {
  return <HelpView />;
}
