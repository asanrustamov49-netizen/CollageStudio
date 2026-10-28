import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import { AccountBootstrap } from "@/components/account/AccountBits";
import { MusicProvider, MusicRouteGuard } from "@/components/music/MusicProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = { themeColor: "#0c0a09" };

export const metadata: Metadata = {
  title: { default: "Collage Studio — фотоколлажи и подарки с QR-кодом", template: "%s · Collage Studio" },
  description: "Готовые фотоколлажи: замените снимки своими, скачайте PNG, JPG или PDF либо подарите страницу-сюрприз по QR-коду.",
  applicationName: "Collage Studio",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MusicProvider>
          {children}
          <AccountBootstrap />
          <Suspense fallback={null}>
            <MusicRouteGuard />
          </Suspense>
        </MusicProvider>
      </body>
    </html>
  );
}
