"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TemplatePreview } from "@/components/TemplatePreview";
import { createText, getCategoryHref, getInitialState } from "@/data/templates";
import {
  commitDraft,
  endMerge,
  redoDraft,
  undoDraft,
  registerPhoto,
  useCollageDraft,
} from "@/store/collageDrafts";
import type { CollageState, CollageTemplate, CollageText, PhotoSlot } from "@/types/collage";
import { PhotoPanel, TextPanel } from "./EditorPanels";
import { downloadBlob, exportCollage } from "./exportCollage";
import { Modal, buttonStyles } from "./Modal";
import { ToastList, useToasts } from "./Toasts";

type Selection = { kind: "photo"; index: number } | { kind: "text"; id: string } | null;

/** Текущее перетаскивание фото (сдвиг кадра) или текста (перемещение). */
interface Drag {
  kind: "photo" | "text";
  target: number | string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  /** Сколько процентов сдвига даёт один пиксель по осям. */
  perPxX: number;
  perPxY: number;
  key: string;
  moved: boolean;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const editorSizes = "(min-width: 1024px) 60vw, 100vw";
const iconButton =
  "flex size-9 items-center justify-center rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-35";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function decodeImage(src: string) {
  const img = new Image();
  img.src = src;
  return img.decode();
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export function CollageEditor({ template }: { template: CollageTemplate }) {
  const draft = useCollageDraft(template.id);
  const [initial] = useState(() => getInitialState(template));
  const state = draft?.present ?? initial;
  const [selection, setSelection] = useState<Selection>(null);
  const [loadingPhoto, setLoadingPhoto] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const { toasts, notify } = useToasts();
  const collageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoRef = useRef<number | null>(null);
  const dragRef = useRef<Drag | null>(null);

  const canUndo = Boolean(draft?.past.length);
  const canRedo = Boolean(draft?.future.length);
  const isPristine = !draft || JSON.stringify(draft.present) === JSON.stringify(initial);
  const selectedPhoto = selection?.kind === "photo" ? state.photos[selection.index] : undefined;
  const selectedText =
    selection?.kind === "text" ? state.texts.find((t) => t.id === selection.id) : undefined;

  function commit(update: (current: CollageState) => CollageState, mergeKey?: string) {
    commitDraft(template.id, initial, update, mergeKey);
  }

  function updatePhoto(index: number, patch: Partial<PhotoSlot>, mergeKey?: string) {
    commit(
      (s) => ({ ...s, photos: s.photos.map((p, i) => (i === index ? { ...p, ...patch } : p)) }),
      mergeKey && `photo-${index}-${mergeKey}`,
    );
  }

  function updateText(id: string, patch: Partial<CollageText>, mergeKey?: string) {
    commit(
      (s) => ({ ...s, texts: s.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
      mergeKey && `text-${id}-${mergeKey}`,
    );
  }

  function finishEdit() {
    endMerge(template.id);
    if (selectedText && !selectedText.text.trim()) updateText(selectedText.id, { text: "Текст" });
  }

  function addText() {
    const id = `text-${Date.now()}`;
    commit((s) => ({ ...s, texts: [...s.texts, createText(id)] }));
    setSelection({ kind: "text", id });
    notify("Текст добавлен — перетащите его в нужное место");
  }

  function deleteText(id: string) {
    commit((s) => ({ ...s, texts: s.texts.filter((t) => t.id !== id) }));
    setSelection(null);
    notify("Текст удалён");
  }

  function openFilePicker(index: number) {
    pendingPhotoRef.current = index;
    fileInputRef.current?.click();
  }

  async function replacePhoto(index: number, file: File) {
    if (!file.type.startsWith("image/")) {
      notify("Этот файл не является изображением. Выберите JPG, PNG или WebP.", "error");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      notify("Файл больше 25 МБ. Выберите изображение поменьше.", "error");
      return;
    }
    setLoadingPhoto(index);
    // Сначала проверяем, что файл декодируется, и только потом сохраняем его.
    const probe = URL.createObjectURL(file);
    try {
      await decodeImage(probe);
    } catch {
      notify("Не удалось открыть изображение. Попробуйте другой файл.", "error");
      setLoadingPhoto(null);
      return;
    } finally {
      URL.revokeObjectURL(probe);
    }
    try {
      const { url, persisted } = await registerPhoto(file);
      updatePhoto(index, { src: url, x: 50, y: 50, zoom: 1 });
      if (persisted) notify(`Фото ${index + 1} заменено`);
      else
        notify(
          `Фото ${index + 1} заменено, но браузер не дал его сохранить: после перезагрузки вернётся фото шаблона.`,
          "error",
        );
    } finally {
      setLoadingPhoto(null);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const index = pendingPhotoRef.current;
    e.target.value = "";
    if (file && index !== null) void replacePhoto(index, file);
  }

  function startPhotoDrag(e: React.PointerEvent<HTMLDivElement>, index: number) {
    setSelection({ kind: "photo", index });
    const img = e.currentTarget.querySelector<HTMLImageElement>("img[data-photo]");
    if (e.button !== 0 || !img?.naturalWidth) return;
    const slot = state.photos[index];
    const { width: w, height: h } = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight) * slot.zoom;
    // Сдвиг на 1px двигает изображение на 1px: процент = 100 / запас по оси.
    const overflowX = img.naturalWidth * ratio - w;
    const overflowY = img.naturalHeight * ratio - h;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      kind: "photo",
      target: index,
      startX: e.clientX,
      startY: e.clientY,
      origX: slot.x,
      origY: slot.y,
      perPxX: overflowX > 0.5 ? -100 / overflowX : 0,
      perPxY: overflowY > 0.5 ? -100 / overflowY : 0,
      key: `drag-${e.timeStamp}`,
      moved: false,
    };
  }

  function startTextDrag(e: React.PointerEvent<HTMLDivElement>, text: CollageText) {
    e.stopPropagation();
    setSelection({ kind: "text", id: text.id });
    const root = collageRef.current;
    if (e.button !== 0 || !root) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      kind: "text",
      target: text.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: text.x,
      origY: text.y,
      perPxX: 100 / root.clientWidth,
      perPxY: 100 / root.clientHeight,
      key: `drag-${e.timeStamp}`,
      moved: false,
    };
  }

  function moveDrag(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 3) return;
    drag.moved = true;
    const x = clamp(drag.origX + dx * drag.perPxX, 0, 100);
    const y = clamp(drag.origY + dy * drag.perPxY, 0, 100);
    if (drag.kind === "photo") updatePhoto(drag.target as number, { x, y }, drag.key);
    else updateText(drag.target as string, { x, y }, drag.key);
  }

  function endDrag() {
    if (dragRef.current?.moved) endMerge(template.id);
    dragRef.current = null;
  }

  function resetTemplate() {
    commit(() => initial);
    setSelection(null);
    setConfirmReset(false);
    notify("Коллаж сброшен к исходному шаблону. Это можно отменить.");
  }

  async function handleDownload() {
    if (!collageRef.current) return;
    setExporting(true);
    try {
      downloadBlob(await exportCollage(collageRef.current), `${template.id}.png`);
      notify("PNG сохранён");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Не удалось экспортировать коллаж.", "error");
    } finally {
      setExporting(false);
    }
  }

  const deleteSelectedText = useRef(deleteText);
  useEffect(() => {
    deleteSelectedText.current = deleteText;
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target) || document.querySelector("dialog[open]")) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) redoDraft(template.id);
        else undoDraft(template.id);
      } else if (mod && key === "y") {
        e.preventDefault();
        redoDraft(template.id);
      } else if (e.key === "Escape") {
        setSelection(null);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selection?.kind === "text") {
        e.preventDefault();
        deleteSelectedText.current(selection.id);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [template.id, selection]);

  return (
    <div className="flex flex-1 flex-col bg-stone-950 text-stone-100">
      <header className="flex flex-wrap items-center gap-3 sticky top-0 z-20 border-b border-stone-800 bg-stone-950/90 px-4 py-3 backdrop-blur md:px-10">
        <Link
          href={getCategoryHref(template.category)}
          className="rounded-full border border-stone-700 px-4 py-1.5 text-sm text-stone-300 hover:bg-stone-800 hover:text-white"
        >
          ← Каталог
        </Link>
        <h1 className="min-w-0 flex-1 truncate font-display text-xl text-stone-100">
          {template.title}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => undoDraft(template.id)}
            disabled={!canUndo}
            aria-label="Отменить"
            title="Отменить (Ctrl+Z)"
            className={iconButton}
          >
            <svg aria-hidden viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4 3 8l4 4" />
              <path d="M3 8h9a5 5 0 0 1 0 10H9" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => redoDraft(template.id)}
            disabled={!canRedo}
            aria-label="Повторить"
            title="Повторить (Ctrl+Shift+Z)"
            className={iconButton}
          >
            <svg aria-hidden viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m13 4 4 4-4 4" />
              <path d="M17 8H8a5 5 0 0 0 0 10h3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            disabled={isPristine}
            className="rounded-lg border border-stone-700 px-4 py-1.5 text-sm font-medium text-stone-300 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Сбросить
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={exporting}
            className="rounded-lg bg-amber-300 px-4 py-1.5 text-sm font-semibold text-stone-950 hover:bg-amber-200 disabled:opacity-40"
          >
            {exporting ? "Экспорт…" : "Скачать PNG"}
          </button>
        </div>
      </header>

      <main className="grid flex-1 content-start gap-6 px-4 py-6 md:px-10 md:py-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section
          aria-label="Коллаж"
          className="min-w-0"
          onPointerDown={(e) => e.target === e.currentTarget && setSelection(null)}
        >
          <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-stone-800 shadow-2xl shadow-black/50">
            <TemplatePreview
              ref={collageRef}
              template={template}
              state={state}
              sizes={editorSizes}
              eager
              cellProps={(index) => ({
                role: "button",
                tabIndex: 0,
                "aria-label": `Фото ${index + 1}: выбрать`,
                "aria-pressed": selection?.kind === "photo" && selection.index === index,
                onPointerDown: (e) => startPhotoDrag(e, index),
                onPointerMove: moveDrag,
                onPointerUp: endDrag,
                onPointerCancel: endDrag,
                onDoubleClick: () => openFilePicker(index),
                onKeyDown: (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelection({ kind: "photo", index });
                  }
                },
                className: `group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
                  selection?.kind === "photo" && selection.index === index ? "cursor-move touch-none" : ""
                }`,
              })}
              renderCellOverlay={(index) => {
                const selected = selection?.kind === "photo" && selection.index === index;
                return (
                  <>
                    <span
                      className={`pointer-events-none absolute inset-0 rounded-md ring-inset ${
                        selected ? "ring-[3px] ring-sky-500" : "ring-white/80 group-hover:ring-2"
                      }`}
                    />
                    {loadingPhoto === index && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <span className="size-7 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
                      </span>
                    )}
                    {selected && loadingPhoto !== index && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => openFilePicker(index)}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900/85 px-3 py-1 text-xs font-medium whitespace-nowrap text-white shadow hover:bg-neutral-900"
                      >
                        Заменить фото
                      </button>
                    )}
                  </>
                );
              }}
              textProps={(t) => {
                const selected = selection?.kind === "text" && selection.id === t.id;
                return {
                  role: "button",
                  tabIndex: 0,
                  "aria-label": `Текст «${t.text}»: выбрать`,
                  "aria-pressed": selected,
                  onPointerDown: (e) => startTextDrag(e, t),
                  onPointerMove: moveDrag,
                  onPointerUp: endDrag,
                  onPointerCancel: endDrag,
                  onKeyDown: (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelection({ kind: "text", id: t.id });
                    }
                  },
                  className: `cursor-move touch-none select-none ${
                    selected
                      ? "outline-2 outline-offset-2 outline-sky-500 outline-dashed"
                      : "hover:outline-2 hover:outline-offset-2 hover:outline-white/90"
                  }`,
                };
              }}
            />
          </div>
          <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-stone-500">
            Нажмите на фото или текст, чтобы изменить их. Ctrl+Z — отменить, Esc — снять выделение.
            Изменения сохраняются в этом браузере; история отмены — до перезагрузки.
          </p>
        </section>

        <aside className="self-start rounded-2xl bg-stone-50 p-5 text-neutral-900 shadow-xl shadow-black/40 lg:sticky lg:top-20 lg:order-first">
          <div className="mb-5 flex items-center justify-between gap-2 border-b border-neutral-100 pb-4">
            <span className="text-sm font-medium text-neutral-500">Настройки</span>
            <button type="button" onClick={addText} className={`${buttonStyles.secondary} py-1.5`}>
              + Добавить текст
            </button>
          </div>
          {selection?.kind === "photo" && selectedPhoto ? (
            <PhotoPanel
              key={selection.index}
              index={selection.index}
              slot={selectedPhoto}
              isOriginal={selectedPhoto.src === template.photos[selection.index]}
              loading={loadingPhoto === selection.index}
              onReplace={() => openFilePicker(selection.index)}
              onRestore={() =>
                updatePhoto(selection.index, { src: template.photos[selection.index], x: 50, y: 50, zoom: 1 })
              }
              onChange={(patch, merge) => updatePhoto(selection.index, patch, merge)}
              onCommitEnd={finishEdit}
            />
          ) : selectedText ? (
            <TextPanel
              key={selectedText.id}
              text={selectedText}
              onChange={(patch, merge) => updateText(selectedText.id, patch, merge)}
              onCommitEnd={finishEdit}
              onDelete={() => deleteText(selectedText.id)}
            />
          ) : (
            <div className="space-y-3 text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">Ничего не выбрано</p>
              <p>Нажмите на фото, чтобы заменить его своим или выбрать кадр.</p>
              <p>Нажмите на текст, чтобы изменить подпись, шрифт, размер и цвет.</p>
            </div>
          )}
        </aside>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {confirmReset && (
        <Modal
          title="Сбросить коллаж?"
          onClose={() => setConfirmReset(false)}
          footer={
            <>
              <button type="button" className={buttonStyles.secondary} onClick={() => setConfirmReset(false)}>
                Отмена
              </button>
              <button type="button" className={buttonStyles.primary} onClick={resetTemplate}>
                Сбросить
              </button>
            </>
          }
        >
          <p className="text-sm text-neutral-600">
            Все фото, тексты и кадрирование вернутся к исходному шаблону. Сброс можно отменить кнопкой
            «Отменить».
          </p>
        </Modal>
      )}

      <ToastList toasts={toasts} />
    </div>
  );
}
