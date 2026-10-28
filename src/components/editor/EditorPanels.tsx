"use client";

import Image from "next/image";
import { skipOptimization } from "@/lib/collageState";
import { aspectOptions, fontOptions, layouts, TEXT_MAX_LENGTH } from "@/data/templates";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import type { CollageStyle, CollageText, FontId, LayoutId, PhotoSlot } from "@/types/collage";

/** Правка из панели; `merge` — ключ, склеивающий непрерывные изменения в один шаг истории. */
type Change<T> = (patch: Partial<T>, merge?: string) => void;

const textSwatches = ["#171717", "#ffffff", "#525252", "#be123c", "#b45309", "#047857", "#1d4ed8", "#7e22ce"];
const frameSwatches = ["#ffffff", "#fbf5ef", "#fff1f2", "#f5f0e8", "#e0f2fe", "#1c1917", "#7f1d1d", "#14532d"];

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  onCommitEnd: () => void;
}

function Slider({ label, value, min, max, step, format, onChange, onCommitEnd }: SliderProps) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm text-stone-700">
        {label}
        <span className="text-stone-500 tabular-nums">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommitEnd}
        onKeyUp={onCommitEnd}
        onBlur={onCommitEnd}
        className="mt-1 block h-8 w-full accent-stone-900"
      />
    </label>
  );
}

function Swatches({ colors, value, onPick, onCustom, label }: { colors: string[]; value: string; onPick: (c: string) => void; onCustom: (c: string) => void; label: string }) {
  return (
    <fieldset>
      <legend className={ui.label}>{label}</legend>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Цвет ${color}`}
            aria-pressed={value.toLowerCase() === color}
            onClick={() => onPick(color)}
            className={`size-9 rounded-full border border-stone-300 ${value.toLowerCase() === color ? "ring-2 ring-stone-900 ring-offset-2" : ""}`}
            style={{ backgroundColor: color }}
          />
        ))}
        <label className="relative inline-flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-stone-400 text-stone-600">
          <Icon name="plus" className="size-4" />
          <span className="sr-only">Свой цвет</span>
          <input type="color" value={value} onChange={(e) => onCustom(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
      </div>
    </fieldset>
  );
}

interface PhotoPanelProps {
  index: number;
  slot: PhotoSlot;
  visibleCount: number;
  pool: PhotoSlot[];
  isOriginal: boolean;
  hasOriginal: boolean;
  loading: boolean;
  onReplace: () => void;
  onRemove: () => void;
  onRestore: () => void;
  onMove: (direction: -1 | 1) => void;
  onPickFromPool: (poolIndex: number) => void;
  onChange: Change<PhotoSlot>;
  onCommitEnd: () => void;
}

export function PhotoPanel(props: PhotoPanelProps) {
  const { index, slot, visibleCount, pool, isOriginal, hasOriginal, loading, onReplace, onRemove, onRestore, onMove, onPickFromPool, onChange, onCommitEnd } = props;
  const isDefaultCrop = slot.zoom === 1 && slot.x === 50 && slot.y === 50;
  const percent = (v: number) => `${Math.round(v)}%`;
  const empty = !slot.src;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Ячейка {index + 1}</h2>
        <div className="flex gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Поменять с предыдущей ячейкой" className={`${ui.secondary} w-11 px-0`}>
            <Icon name="left" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index >= visibleCount - 1} aria-label="Поменять со следующей ячейкой" className={`${ui.secondary} w-11 px-0`}>
            <Icon name="right" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onReplace} disabled={loading} className={`${ui.primary} col-span-2`}>
          <Icon name="upload" className="size-4" />
          {loading ? "Загрузка…" : empty ? "Добавить фото" : "Заменить своим фото"}
        </button>
        {!empty && (
          <button type="button" onClick={onRemove} className={ui.secondary}>
            <Icon name="trash" className="size-4" /> Убрать
          </button>
        )}
        {hasOriginal && !isOriginal && (
          <button type="button" onClick={onRestore} className={`${ui.secondary} ${empty ? "col-span-2" : ""}`}>
            Фото шаблона
          </button>
        )}
      </div>

      {!empty && (
        <>
          <Slider label="Масштаб" value={slot.zoom} min={1} max={3} step={0.01} format={(v) => `${v.toFixed(2)}×`} onChange={(zoom) => onChange({ zoom }, "zoom")} onCommitEnd={onCommitEnd} />
          <Slider label="Кадр по горизонтали" value={slot.x} min={0} max={100} step={1} format={percent} onChange={(x) => onChange({ x }, "x")} onCommitEnd={onCommitEnd} />
          <Slider label="Кадр по вертикали" value={slot.y} min={0} max={100} step={1} format={percent} onChange={(y) => onChange({ y }, "y")} onCommitEnd={onCommitEnd} />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-stone-500">Перетащите фото на коллаже, чтобы выбрать кадр.</p>
            <button type="button" disabled={isDefaultCrop} onClick={() => onChange({ zoom: 1, x: 50, y: 50 })} className={`${ui.secondary} shrink-0`}>
              Сбросить кадр
            </button>
          </div>
        </>
      )}

      {pool.some((p) => p.src) && (
        <div>
          <p className={ui.label}>Фото проекта</p>
          <p className="mt-0.5 text-xs text-stone-500">Нажмите на снимок, чтобы поставить его в эту ячейку (снимки поменяются местами).</p>
          <ul className="mt-2 grid grid-cols-4 gap-2">
            {pool.map((p, i) =>
              p.src ? (
                <li key={`${i}-${p.src}`}>
                  <button
                    type="button"
                    onClick={() => onPickFromPool(i)}
                    disabled={i === index}
                    aria-label={`Фото ${i + 1}${i >= visibleCount ? " (в запасе)" : ""}`}
                    className={`relative block aspect-square w-full overflow-hidden rounded-lg ring-offset-2 ${i === index ? "ring-2 ring-stone-900" : "hover:opacity-80"}`}
                  >
                    <Image src={p.src} alt="" fill sizes="80px" unoptimized={skipOptimization(p.src)} className="object-cover" />
                    <span className="absolute top-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">{i >= visibleCount ? "запас" : i + 1}</span>
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

interface TextPanelProps {
  text: CollageText;
  onChange: Change<CollageText>;
  onCommitEnd: () => void;
  onDelete: () => void;
}

export function TextPanel({ text, onChange, onCommitEnd, onDelete }: TextPanelProps) {
  const empty = !text.text.trim();
  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl">Текст</h2>
      <label className="block">
        <span className="flex justify-between">
          <span className={ui.label}>Содержимое</span>
          <span className="text-xs text-stone-500 tabular-nums">
            {text.text.length}/{TEXT_MAX_LENGTH}
          </span>
        </span>
        <textarea
          value={text.text}
          rows={3}
          maxLength={TEXT_MAX_LENGTH}
          placeholder="Введите текст"
          aria-invalid={empty}
          onChange={(e) => onChange({ text: e.target.value }, "text")}
          onBlur={onCommitEnd}
          className={`${ui.field} resize-none`}
        />
        {empty && <span className="mt-1 block text-xs text-red-700">Пустой текст не попадёт в коллаж — введите хотя бы одно слово.</span>}
      </label>
      <Slider label="Размер" value={text.size} min={12} max={96} step={1} format={(v) => `${v}px`} onChange={(size) => onChange({ size }, "size")} onCommitEnd={onCommitEnd} />
      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <label className="block">
          <span className={ui.label}>Шрифт</span>
          <select value={text.fontId} onChange={(e) => onChange({ fontId: e.target.value as FontId })} className={ui.field}>
            {fontOptions.map((font) => (
              <option key={font.id} value={font.id}>
                {font.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" aria-pressed={text.bold} onClick={() => onChange({ bold: !text.bold })} className={`${text.bold ? ui.primary : ui.secondary} w-11 px-0 font-bold`}>
          Ж
        </button>
      </div>
      <Swatches label="Цвет" colors={textSwatches} value={text.color} onPick={(color) => onChange({ color })} onCustom={(color) => onChange({ color }, "color")} />
      <label className="flex min-h-11 items-center gap-3 text-sm text-stone-800">
        <input type="checkbox" checked={text.background} onChange={(e) => onChange({ background: e.target.checked })} className="size-5 accent-stone-900" />
        Светлая подложка
      </label>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-stone-500">Перетащите текст на коллаже, чтобы переместить.</p>
        <button type="button" onClick={onDelete} className={ui.danger}>
          <Icon name="trash" className="size-4" /> Удалить
        </button>
      </div>
    </div>
  );
}

interface StylePanelProps {
  style: CollageStyle;
  onChange: Change<CollageStyle>;
  onCommitEnd: () => void;
}

export function StylePanel({ style, onChange, onCommitEnd }: StylePanelProps) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl">Оформление</h2>
      <Swatches label="Цвет рамки и фона" colors={frameSwatches} value={style.background} onPick={(background) => onChange({ background })} onCustom={(background) => onChange({ background }, "background")} />
      <Slider label="Отступы" value={style.gap} min={0} max={32} step={1} format={(v) => `${v}`} onChange={(gap) => onChange({ gap }, "gap")} onCommitEnd={onCommitEnd} />
      <Slider label="Скругление" value={style.radius} min={0} max={40} step={1} format={(v) => `${v}`} onChange={(radius) => onChange({ radius }, "radius")} onCommitEnd={onCommitEnd} />
      <fieldset>
        <legend className={ui.label}>Формат</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {aspectOptions.map((a) => (
            <button key={a.id} type="button" aria-pressed={style.aspect === a.id} onClick={() => onChange({ aspect: a.id })} className={`${style.aspect === a.id ? ui.primary : ui.secondary} px-2 text-xs`}>
              {a.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

interface LayoutPanelProps {
  layoutId: LayoutId;
  photoCount: number;
  onSelect: (id: LayoutId) => void;
  onReset: () => void;
  canReset: boolean;
}

export function LayoutPanel({ layoutId, photoCount, onSelect, onReset, canReset }: LayoutPanelProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl">Макет</h2>
        <p className="mt-1 text-xs text-stone-500">Фото не теряются: при меньшем числе ячеек лишние уходят в запас и вернутся при смене макета.</p>
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {layouts.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              aria-pressed={l.id === layoutId}
              onClick={() => onSelect(l.id)}
              className={`block w-full rounded-xl border p-2 text-left transition-colors ${l.id === layoutId ? "border-stone-900 bg-white ring-1 ring-stone-900" : "border-stone-200 bg-white hover:border-stone-400"}`}
            >
              <span
                aria-hidden
                className="grid aspect-[4/3] gap-0.5"
                style={{ gridTemplateColumns: `repeat(${l.columns}, 1fr)`, gridTemplateRows: `repeat(${l.rows}, 1fr)` }}
              >
                {l.cells.map((area, i) => (
                  <span key={area} className={`rounded-sm ${i < photoCount ? "bg-stone-400" : "bg-stone-200"}`} style={{ gridArea: area }} />
                ))}
              </span>
              <span className="mt-1.5 block truncate text-xs font-medium text-stone-800">{l.label}</span>
              <span className="block text-[11px] text-stone-500">{l.cells.length} фото</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onReset} disabled={!canReset} className={`${ui.secondary} w-full`}>
        Сбросить к исходному шаблону
      </button>
    </div>
  );
}
