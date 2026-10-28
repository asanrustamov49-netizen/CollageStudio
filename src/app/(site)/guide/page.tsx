import type { Metadata } from "next";
import Link from "next/link";
import { TemplatePreview } from "@/components/TemplatePreview";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { guideSteps, printSizes } from "@/data/content";
import { getInitialState, getTemplateById } from "@/data/templates";

export const metadata: Metadata = {
  title: "Как это работает",
  description: "Пять шагов от шаблона до напечатанного коллажа или подарка с QR-кодом, таблица размеров для печати и советы.",
};

const example = getTemplateById("weekend-trip")!;

export default function GuidePage() {
  return (
    <main className="flex-1">
      <section className="border-b border-stone-900 px-4 py-14 md:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs tracking-[0.2em] text-amber-300 uppercase">Как это работает</p>
            <h1 className="mt-3 font-display text-4xl text-balance md:text-6xl">От снимков в телефоне до коллажа в рамке</h1>
            <p className="mt-4 max-w-xl text-stone-400">Пять шагов, которые занимают несколько минут. Регистрация не нужна — начните прямо сейчас.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/collages" className={`${ui.accent} rounded-full px-6`}>Выбрать шаблон</Link>
              <Link href="/help" className={`${ui.darkSecondary} rounded-full px-6`}>Вопросы и ответы</Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 shadow-black/60 ring-stone-800">
            <TemplatePreview template={example} state={getInitialState(example)} sizes="(min-width: 1024px) 40vw, 90vw" eager />
          </div>
        </div>
      </section>

      <section aria-label="Шаги" className="px-4 py-14 md:px-8">
        <ol className="mx-auto max-w-5xl space-y-5">
          {guideSteps.map((s, i) => (
            <li key={s.title} className="grid gap-5 rounded-3xl bg-stone-900 p-6 ring-1 ring-stone-800 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,18rem)] md:p-8">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-amber-300 text-stone-950">
                <Icon name={s.icon} className="size-7" />
              </span>
              <div>
                <p className="font-mono text-sm text-stone-500">Шаг {i + 1}</p>
                <h2 className="mt-1 font-display text-2xl md:text-3xl">{s.title}</h2>
                <p className="mt-2 text-stone-400">{s.text}</p>
              </div>
              <ul className="space-y-2 self-center text-sm text-stone-300">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Icon name="check" className="mt-0.5 size-4 text-amber-300" /> {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="print" className="border-t border-stone-900 px-4 py-14 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 id="print" className="font-display text-3xl">Размеры для печати</h2>
          <p className="mt-2 max-w-2xl text-stone-400">Для чёткой печати нужно около 300 точек на дюйм. Выберите в окне «Экспорт» размер не меньше указанного.</p>
          <div className="mt-6 overflow-x-auto rounded-2xl ring-1 ring-stone-800">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="bg-stone-900 text-stone-400">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Формат печати</th>
                  <th scope="col" className="px-4 py-3 font-medium">Нужно пикселей</th>
                  <th scope="col" className="px-4 py-3 font-medium">Размер в экспорте</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {printSizes.map((r) => (
                  <tr key={r.format}>
                    <td className="px-4 py-3 text-stone-100">{r.format}</td>
                    <td className="px-4 py-3 text-stone-300 tabular-nums">{r.px}</td>
                    <td className="px-4 py-3 text-stone-300">{r.preset}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-stone-500">Пропорции A4 (1 : 1,41) длиннее формата «Портрет 3:4» — при печати на A4 останутся поля сверху и снизу.</p>
        </div>
      </section>
    </main>
  );
}
