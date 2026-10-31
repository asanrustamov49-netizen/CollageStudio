"use client";
import { useState } from "react";
import { TemplatePreview } from "@/components/TemplatePreview";
import { getInitialState } from "@/data/templates";
import type { CollageTemplate } from "@/types/collage";

const heroSizes = "(min-width: 1024px) 40vw, 90vw";

const positions = [
  "z-30 shadow-2xl shadow-black/60",
  "z-20 hidden -translate-x-[58%] translate-y-8 -rotate-8 scale-85 opacity-70 sm:block",
  "z-10 hidden translate-x-[58%] translate-y-8 rotate-8 scale-85 opacity-70 sm:block",
];

export function HeroStack({ templates }: { templates: CollageTemplate[] }) {
  const [order, setOrder] = useState(() => templates.map((t) => t.id));
  const [evaporating, setEvaporating] = useState<string | null>(null);
  const [reappearing, setReappearing] = useState<string | null>(null);

  function sendTopToBack() {
    setOrder(([top, ...rest]) => [...rest, top]);
    setReappearing(order[0]);
    setEvaporating(null);
  }

  function next() {
    if (evaporating || order.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      sendTopToBack();
    else setEvaporating(order[0]);
  }

  return (
    <div className="mx-auto mt-14 w-full max-w-md lg:max-w-xl">
      <button
        type="button"
        onClick={next}
        aria-label="Показать следующий пример коллажа"
        className="relative block aspect-[4/3] w-full cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
      >
        {templates.map((t) => {
          const position = order.indexOf(t.id);
          const animation =
            evaporating === t.id
              ? "animate-evaporate"
              : reappearing === t.id
                ? "animate-reappear"
                : "";
          return (
            <div
              key={t.id}
              onAnimationEnd={() =>
                evaporating === t.id ? sendTopToBack() : setReappearing(null)
              }
              className={`absolute inset-0 overflow-hidden rounded-2xl border border-white/10 bg-white transition-[translate,rotate,scale,opacity,box-shadow] duration-500 ease-out ${positions[position] ?? positions[2]} ${animation}`}
            >
              <TemplatePreview
                template={t}
                state={getInitialState(t)}
                sizes={heroSizes}
                eager
              />
            </div>
          );
        })}
      </button>
      <p className="mt-12 text-center text-xs text-stone-500">
        Нажмите на коллаж, чтобы посмотреть следующий
      </p>
    </div>
  );
}
