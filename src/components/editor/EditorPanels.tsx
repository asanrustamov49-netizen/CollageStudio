"use client";

import { fontOptions } from "@/data/templates";
import type { CollageText, FontId, PhotoSlot } from "@/types/collage";
import { buttonStyles } from "./Modal";

/** Правка из панели; `merge` — ключ, склеивающий непрерывные изменения в один шаг истории. */
type Change<T> = (patch: Partial<T>, merge?: string) => void;

const fieldStyles =
  "mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none";

const swatches = ["#171717", "#ffffff", "#525252", "#be123c", "#b45309", "#047857", "#1d4ed8", "#7e22ce"];

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
      <span className="flex justify-between text-sm text-neutral-600">
        {label}
        <span className="tabular-nums text-neutral-400">{format(value)}</span>
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
        className="mt-2 block w-full accent-neutral-900"
      />
    </label>
  );
}

interface PhotoPanelProps {
  index: number;
  slot: PhotoSlot;
  isOriginal: boolean;
  loading: boolean;
  onReplace: () => void;
  onRestore: () => void;
  onChange: Change<PhotoSlot>;
  onCommitEnd: () => void;
}

export function PhotoPanel({
  index,
  slot,
  isOriginal,
  loading,
  onReplace,
  onRestore,
  onChange,
  onCommitEnd,
}: PhotoPanelProps) {
  const isDefaultCrop = slot.zoom === 1 && slot.x === 50 && slot.y === 50;
  const percent = (v: number) => `${Math.round(v)}%`;

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-neutral-900">Фото {index + 1}</h2>
      <button
        type="button"
        onClick={onReplace}
        disabled={loading}
        className={`${buttonStyles.primary} w-full`}
      >
        {loading ? "Загрузка…" : "Заменить своим фото"}
      </button>
      <Slider
        label="Масштаб"
        value={slot.zoom}
        min={1}
        max={3}
        step={0.01}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(zoom) => onChange({ zoom }, "zoom")}
        onCommitEnd={onCommitEnd}
      />
      <Slider
        label="Сдвиг по горизонтали"
        value={slot.x}
        min={0}
        max={100}
        step={1}
        format={percent}
        onChange={(x) => onChange({ x }, "x")}
        onCommitEnd={onCommitEnd}
      />
      <Slider
        label="Сдвиг по вертикали"
        value={slot.y}
        min={0}
        max={100}
        step={1}
        format={percent}
        onChange={(y) => onChange({ y }, "y")}
        onCommitEnd={onCommitEnd}
      />
      <p className="text-xs text-neutral-500">
        Перетащите фото на коллаже, чтобы выбрать кадр. Двойной клик по фото — быстрая замена.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isDefaultCrop}
          onClick={() => onChange({ zoom: 1, x: 50, y: 50 })}
          className={`${buttonStyles.secondary} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          Сбросить кадр
        </button>
        {!isOriginal && (
          <button type="button" onClick={onRestore} className={buttonStyles.secondary}>
            Вернуть фото шаблона
          </button>
        )}
      </div>
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
  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-neutral-900">Текст</h2>
      <label className="block">
        <span className="text-sm text-neutral-600">Содержимое</span>
        <input
          type="text"
          value={text.text}
          maxLength={80}
          placeholder="Введите текст"
          onChange={(e) => onChange({ text: e.target.value }, "text")}
          onBlur={onCommitEnd}
          className={fieldStyles}
        />
      </label>
      <Slider
        label="Размер"
        value={text.size}
        min={12}
        max={96}
        step={1}
        format={(v) => `${v}px`}
        onChange={(size) => onChange({ size }, "size")}
        onCommitEnd={onCommitEnd}
      />
      <label className="block">
        <span className="text-sm text-neutral-600">Шрифт</span>
        <select
          value={text.fontId}
          onChange={(e) => onChange({ fontId: e.target.value as FontId })}
          className={fieldStyles}
        >
          {fontOptions.map((font) => (
            <option key={font.id} value={font.id}>
              {font.label}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="text-sm text-neutral-600">Цвет</legend>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {swatches.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Цвет ${color}`}
              aria-pressed={text.color === color}
              onClick={() => onChange({ color })}
              className={`size-7 rounded-full border border-neutral-300 ${
                text.color === color ? "ring-2 ring-neutral-900 ring-offset-2" : ""
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <input
            type="color"
            aria-label="Свой цвет"
            value={text.color}
            onChange={(e) => onChange({ color: e.target.value }, "color")}
            onBlur={onCommitEnd}
            className="h-7 w-10 cursor-pointer rounded-md border border-neutral-200 bg-white p-0.5"
          />
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={text.background}
          onChange={(e) => onChange({ background: e.target.checked })}
          className="size-4 accent-neutral-900"
        />
        Светлая подложка
      </label>
      <p className="text-xs text-neutral-500">Перетащите текст на коллаже, чтобы переместить его.</p>
      <button type="button" onClick={onDelete} className={`${buttonStyles.danger} -ml-4`}>
        Удалить текст
      </button>
    </div>
  );
}
