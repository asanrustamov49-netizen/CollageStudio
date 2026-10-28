"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { TemplatePreview } from "@/components/TemplatePreview";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { useAccount } from "@/store/account";
import { createText, emptySlot, getInitialState, getLayout, getTemplateById } from "@/data/templates";
import {
  commitProject,
  endMerge,
  redoProject,
  registerPhoto,
  renameProject,
  retrySave,
  undoProject,
  useProject,
  useSaveStatus,
  type ProjectHistory,
  type ProjectMeta,
} from "@/store/projects";
import type { CollageState, CollageStyle, CollageTemplate, CollageText, PhotoSlot } from "@/types/collage";
import { LayoutPanel, PhotoPanel, StylePanel, TextPanel } from "./EditorPanels";
import { ExportDialog } from "./ExportDialog";
import { GiftDialog } from "./GiftDialog";
import { Modal } from "./Modal";
import { ToastList, useToasts } from "./Toasts";

type Selection = { kind: "photo"; index: number } | { kind: "text"; id: string } | null;
type Tab = "element" | "style" | "layout";
type Dialog = "export" | "gift" | "reset" | null;

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

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED = /^image\/(jpeg|png|webp|gif|avif|heic|heif)$/;
const editorSizes = "(min-width: 1024px) 60vw, 100vw";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function decodeImage(src: string) {
  const img = new Image();
  img.src = src;
  return img.decode();
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/** Пул фото нужной длины: недостающие ячейки — пустые. */
function padPhotos(photos: PhotoSlot[], length: number) {
  return photos.length >= length ? photos : [...photos, ...Array.from({ length: length - photos.length }, () => ({ ...emptySlot }))];
}

/** Загружает проект и показывает состояние загрузки или «не найден». */
export function ProjectEditor({ projectId }: { projectId: string }) {
  const load = useProject(projectId);
  if (load.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center bg-stone-950 text-stone-400" role="status">
        <span className="mr-3 size-6 animate-spin rounded-full border-2 border-stone-700 border-t-amber-300" />
        Открываем проект…
      </div>
    );
  }
  const template = load.status === "ready" ? getTemplateById(load.meta.templateId) : undefined;
  if (load.status === "missing" || !template) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-stone-950 px-6 text-center text-stone-200">
        <Icon name="folder" className="size-10 text-stone-500" />
        <h1 className="font-display text-3xl">Проект не найден</h1>
        <p className="max-w-sm text-sm text-stone-400">Возможно, он удалён или создан в другом браузере: проекты хранятся только на этом устройстве.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/projects" className={ui.darkSecondary}>Мои проекты</Link>
          <Link href="/collages" className={ui.accent}>Выбрать шаблон</Link>
        </div>
      </div>
    );
  }
  return <CollageEditor meta={load.meta} history={load.history} template={template} />;
}

function SaveBadge({ id }: { id: string }) {
  const status = useSaveStatus(id);
  const inAccount = useAccount().status === "user";
  if (status === "idle") return null;
  const view: Record<Exclude<typeof status, "idle">, { icon: IconName | null; text: string; tone: string }> = {
    saving: { icon: null, text: "Сохраняется…", tone: "text-stone-400" },
    saved: { icon: "check", text: inAccount ? "Сохранено в аккаунте" : "Сохранено на устройстве", tone: "text-emerald-400" },
    partial: { icon: "alert", text: "Не все фото сохранены", tone: "text-amber-300" },
    error: { icon: "alert", text: "Ошибка сохранения", tone: "text-red-400" },
  };
  const { icon, text, tone } = view[status];
  return (
    <span role="status" className={`inline-flex items-center gap-1.5 text-xs whitespace-nowrap ${tone}`}>
      {icon ? <Icon name={icon} className="size-4" /> : <span className="size-3 animate-spin rounded-full border-2 border-stone-600 border-t-stone-300" />}
      <span className={status === "saved" || status === "saving" ? "hidden sm:inline" : ""}>{text}</span>
      {status === "error" && (
        <button type="button" onClick={() => retrySave(id)} className="ml-1 underline underline-offset-2">
          Повторить
        </button>
      )}
    </span>
  );
}

interface EditorProps {
  meta: ProjectMeta;
  history: ProjectHistory;
  template: CollageTemplate;
}

function CollageEditor({ meta, history, template }: EditorProps) {
  const id = meta.id;
  const state = history.present;
  const layout = getLayout(state.layoutId);
  const visible = layout.cells.length;
  const [initial] = useState(() => getInitialState(template));
  const [selection, setSelection] = useState<Selection>(null);
  const [tab, setTab] = useState<Tab>("element");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [loadingPhoto, setLoadingPhoto] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [name, setName] = useState(meta.name);
  const { toasts, notify } = useToasts();
  const collageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<{ mode: "cell"; index: number } | { mode: "add" } | null>(null);
  const dragRef = useRef<Drag | null>(null);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const isPristine = JSON.stringify(state) === JSON.stringify(initial);
  const selectedPhotoIndex = selection?.kind === "photo" && selection.index < visible ? selection.index : null;
  const selectedText = selection?.kind === "text" ? state.texts.find((t) => t.id === selection.id) : undefined;
  const getRoot = useCallback(() => collageRef.current, []);

  function commit(update: (current: CollageState) => CollageState, mergeKey?: string) {
    commitProject(id, update, mergeKey);
  }

  function updatePhoto(index: number, patch: Partial<PhotoSlot>, mergeKey?: string) {
    commit(
      (s) => ({ ...s, photos: padPhotos(s.photos, index + 1).map((p, i) => (i === index ? { ...p, ...patch } : p)) }),
      mergeKey && `photo-${index}-${mergeKey}`,
    );
  }

  function swapPhotos(a: number, b: number) {
    commit((s) => {
      const photos = [...padPhotos(s.photos, Math.max(a, b) + 1)];
      [photos[a], photos[b]] = [photos[b], photos[a]];
      return { ...s, photos };
    });
  }

  function updateText(textId: string, patch: Partial<CollageText>, mergeKey?: string) {
    commit((s) => ({ ...s, texts: s.texts.map((t) => (t.id === textId ? { ...t, ...patch } : t)) }), mergeKey && `text-${textId}-${mergeKey}`);
  }

  function updateStyle(patch: Partial<CollageStyle>, mergeKey?: string) {
    commit((s) => ({ ...s, style: { ...s.style, ...patch } }), mergeKey && `style-${mergeKey}`);
  }

  function select(next: Selection) {
    setSelection(next);
    if (next) {
      setTab("element");
      setSheetOpen(true);
    }
  }

  function finishEdit() {
    endMerge(id);
  }

  function addText() {
    const textId = `text-${Date.now()}`;
    commit((s) => ({ ...s, texts: [...s.texts, createText(textId)] }));
    select({ kind: "text", id: textId });
    notify("Текст добавлен — перетащите его в нужное место");
  }

  function deleteText(textId: string) {
    commit((s) => ({ ...s, texts: s.texts.filter((t) => t.id !== textId) }));
    setSelection(null);
    notify("Текст удалён");
  }

  function openPicker(target: { mode: "cell"; index: number } | { mode: "add" }) {
    pendingRef.current = target;
    if (fileInputRef.current) {
      fileInputRef.current.multiple = target.mode === "add";
      fileInputRef.current.click();
    }
  }

  /** Проверяет файл и сохраняет его; null — файл отклонён (пользователь уже уведомлён). */
  async function prepareFile(file: File): Promise<{ url: string; persisted: boolean } | null> {
    if (!ACCEPTED.test(file.type)) {
      notify(`«${file.name}» — не изображение. Подойдут JPG, PNG, WebP, GIF, AVIF.`, "error");
      return null;
    }
    if (file.size > MAX_FILE_BYTES) {
      notify(`«${file.name}» больше 15 МБ. Выберите файл поменьше.`, "error");
      return null;
    }
    const probe = URL.createObjectURL(file);
    try {
      await decodeImage(probe);
    } catch {
      notify(`Не удалось открыть «${file.name}». Возможно, файл повреждён.`, "error");
      return null;
    } finally {
      URL.revokeObjectURL(probe);
    }
    return registerPhoto(file);
  }

  async function replacePhoto(index: number, file: File) {
    setLoadingPhoto(index);
    try {
      const result = await prepareFile(file);
      if (!result) return;
      updatePhoto(index, { src: result.url, x: 50, y: 50, zoom: 1 });
      if (result.persisted) notify(`Фото в ячейке ${index + 1} заменено`);
      else notify("Фото добавлено, но браузер не дал его сохранить: после перезагрузки ячейка будет пустой.", "error");
    } finally {
      setLoadingPhoto(null);
    }
  }

  async function addPhotos(files: File[]) {
    const ready = (await Promise.all(files.slice(0, 12).map(prepareFile))).filter((r) => r !== null);
    if (!ready.length) return;
    let placed = 0;
    commit((s) => {
      const photos = [...padPhotos(s.photos, visible)];
      for (const r of ready) {
        const empty = photos.findIndex((p, i) => i < visible && !p.src);
        const slot = { ...emptySlot, src: r.url };
        if (empty >= 0) {
          photos[empty] = slot;
          placed++;
        } else photos.push(slot);
      }
      return { ...s, photos };
    });
    const reserve = ready.length - placed;
    notify(
      `Добавлено фото: ${ready.length}.${placed ? ` В пустые ячейки: ${placed}.` : ""}${reserve ? ` В запас: ${reserve} — выберите ячейку и нажмите на снимок в «Фото проекта».` : ""}`,
    );
    if (ready.some((r) => !r.persisted)) notify("Часть фото не удалось сохранить в браузере — после перезагрузки их не будет.", "error");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    const target = pendingRef.current;
    e.target.value = "";
    if (!files.length || !target) return;
    if (target.mode === "cell") void replacePhoto(target.index, files[0]);
    else void addPhotos(files);
  }

  function startPhotoDrag(e: React.PointerEvent<HTMLDivElement>, index: number) {
    select({ kind: "photo", index });
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
    select({ kind: "text", id: text.id });
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
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    const x = clamp(drag.origX + dx * drag.perPxX, 0, 100);
    const y = clamp(drag.origY + dy * drag.perPxY, 0, 100);
    if (drag.kind === "photo") updatePhoto(drag.target as number, { x, y }, drag.key);
    else updateText(drag.target as string, { x, y }, drag.key);
  }

  function endDrag() {
    if (dragRef.current?.moved) endMerge(id);
    dragRef.current = null;
  }

  function resetTemplate() {
    commit(() => initial);
    setSelection(null);
    setDialog(null);
    notify("Коллаж сброшен к шаблону. Отменить — кнопка «Назад».");
  }

  function saveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(meta.name);
      notify("Название не может быть пустым", "error");
      return;
    }
    if (trimmed !== meta.name) {
      renameProject(id, trimmed);
      notify("Название сохранено");
    }
  }

  const deleteRef = useRef(deleteText);
  useEffect(() => {
    deleteRef.current = deleteText;
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target) || document.querySelector("dialog[open]")) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) redoProject(id);
        else undoProject(id);
      } else if (mod && key === "y") {
        e.preventDefault();
        redoProject(id);
      } else if (e.key === "Escape") {
        setSelection(null);
        setSheetOpen(false);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selection?.kind === "text") {
        e.preventDefault();
        deleteRef.current(selection.id);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [id, selection]);

  const panel =
    tab === "style" ? (
      <StylePanel style={state.style} onChange={updateStyle} onCommitEnd={finishEdit} />
    ) : tab === "layout" ? (
      <LayoutPanel
        layoutId={state.layoutId}
        photoCount={state.photos.filter((p) => p.src).length}
        onSelect={(layoutId) => {
          commit((s) => ({ ...s, layoutId, photos: padPhotos(s.photos, getLayout(layoutId).cells.length) }));
          setSelection(null);
        }}
        canReset={!isPristine}
        onReset={() => setDialog("reset")}
      />
    ) : selectedPhotoIndex !== null ? (
      <PhotoPanel
        key={selectedPhotoIndex}
        index={selectedPhotoIndex}
        slot={state.photos[selectedPhotoIndex] ?? emptySlot}
        visibleCount={visible}
        pool={state.photos}
        isOriginal={state.photos[selectedPhotoIndex]?.src === template.photos[selectedPhotoIndex]}
        hasOriginal={Boolean(template.photos[selectedPhotoIndex])}
        loading={loadingPhoto === selectedPhotoIndex}
        onReplace={() => openPicker({ mode: "cell", index: selectedPhotoIndex })}
        onRemove={() => {
          updatePhoto(selectedPhotoIndex, { ...emptySlot });
          notify("Фото убрано из ячейки");
        }}
        onRestore={() => updatePhoto(selectedPhotoIndex, { ...emptySlot, src: template.photos[selectedPhotoIndex] })}
        onMove={(dir) => {
          const target = selectedPhotoIndex + dir;
          swapPhotos(selectedPhotoIndex, target);
          setSelection({ kind: "photo", index: target });
        }}
        onPickFromPool={(poolIndex) => swapPhotos(selectedPhotoIndex, poolIndex)}
        onChange={(patch, merge) => updatePhoto(selectedPhotoIndex, patch, merge)}
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
      <div className="space-y-4 text-sm text-stone-600">
        <h2 className="font-display text-xl text-stone-900">С чего начать</h2>
        <ul className="space-y-2">
          <li className="flex gap-2"><Icon name="image" className="size-5 text-stone-500" />Нажмите на фото — замените, уберите или выберите кадр.</li>
          <li className="flex gap-2"><Icon name="type" className="size-5 text-stone-500" />Нажмите на текст — измените подпись, шрифт и цвет.</li>
          <li className="flex gap-2"><Icon name="upload" className="size-5 text-stone-500" />Перетащите файлы с компьютера прямо на ячейку.</li>
        </ul>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => openPicker({ mode: "add" })} className={ui.primary}>
            <Icon name="upload" className="size-4" /> Добавить фото
          </button>
          <button type="button" onClick={addText} className={ui.secondary}>
            <Icon name="plus" className="size-4" /> Текст
          </button>
        </div>
      </div>
    );

  const tabs: { id: Tab; label: string; icon: IconName }[] = [
    { id: "element", label: selection ? "Элемент" : "Начало", icon: selection?.kind === "text" ? "type" : "image" },
    { id: "style", label: "Стиль", icon: "palette" },
    { id: "layout", label: "Макет", icon: "layout" },
  ];

  type BottomAction = "photo" | "text" | "style" | "layout" | "export" | "gift";
  const bottomActions: { id: BottomAction; label: string; icon: IconName }[] = [
    { id: "photo", label: "Фото", icon: "upload" },
    { id: "text", label: "Текст", icon: "type" },
    { id: "style", label: "Стиль", icon: "palette" },
    { id: "layout", label: "Макет", icon: "layout" },
    { id: "export", label: "Экспорт", icon: "download" },
    { id: "gift", label: "Подарок", icon: "gift" },
  ];

  function runAction(action: BottomAction) {
    if (action === "photo") openPicker({ mode: "add" });
    else if (action === "text") addText();
    else if (action === "style" || action === "layout") {
      setTab(action);
      setSheetOpen(true);
    } else setDialog(action);
  }

  return (
    <div className="flex flex-1 flex-col bg-stone-950 text-stone-100">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-stone-800 bg-stone-950/90 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur sm:gap-3 md:px-6">
        <Link href="/projects" aria-label="Мои проекты" className={ui.darkIcon}>
          <Icon name="left" />
        </Link>
        <div className="min-w-0 flex-1">
          <input
            value={name}
            maxLength={60}
            aria-label="Название проекта"
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="block w-full min-w-0 truncate rounded-lg bg-transparent px-2 py-1 font-display text-lg text-stone-100 hover:bg-stone-900 focus:bg-stone-900 focus:outline-none sm:text-xl"
          />
          <div className="flex items-center gap-2 px-2">
            <span className="truncate text-[11px] text-stone-500">{template.title}</span>
            <SaveBadge id={id} />
          </div>
        </div>
        <button type="button" onClick={() => undoProject(id)} disabled={!canUndo} aria-label="Отменить" title="Отменить (Ctrl+Z)" className={ui.darkIcon}>
          <Icon name="undo" />
        </button>
        <button type="button" onClick={() => redoProject(id)} disabled={!canRedo} aria-label="Повторить" title="Повторить (Ctrl+Shift+Z)" className={ui.darkIcon}>
          <Icon name="redo" />
        </button>
        <div className="hidden items-center gap-2 lg:flex">
          <button type="button" onClick={() => setDialog("reset")} disabled={isPristine} className={ui.darkSecondary}>
            Сбросить
          </button>
          <button type="button" onClick={() => setDialog("gift")} className={ui.darkSecondary}>
            <Icon name="gift" className="size-4" /> Подарок
          </button>
          <button type="button" onClick={() => setDialog("export")} className={ui.accent}>
            <Icon name="download" className="size-4" /> Экспорт
          </button>
        </div>
      </header>

      <main className="grid flex-1 content-start gap-6 px-3 pt-4 pb-28 md:px-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:pb-8">
        <section
          aria-label="Коллаж"
          className="min-w-0 lg:col-start-2"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelection(null);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = [...e.dataTransfer.files];
            if (files.length) void addPhotos(files);
          }}
        >
          <div className="mx-auto max-w-3xl overflow-hidden rounded-xl shadow-2xl ring-1 shadow-black/50 ring-stone-800" style={{ maxWidth: state.style.aspect === "3/4" ? "34rem" : undefined }}>
            <TemplatePreview
              ref={collageRef}
              template={template}
              state={{ ...state, photos: padPhotos(state.photos, visible) }}
              sizes={editorSizes}
              eager
              cellProps={(index) => ({
                role: "button",
                tabIndex: 0,
                "aria-label": `Ячейка ${index + 1}: ${state.photos[index]?.src ? "выбрать фото" : "добавить фото"}`,
                "aria-pressed": selectedPhotoIndex === index,
                onPointerDown: (e) => startPhotoDrag(e, index),
                onPointerMove: moveDrag,
                onPointerUp: endDrag,
                onPointerCancel: endDrag,
                onDoubleClick: () => openPicker({ mode: "cell", index }),
                onDragOver: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropTarget(index);
                },
                onDragLeave: () => setDropTarget(null),
                onDrop: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropTarget(null);
                  const file = e.dataTransfer.files[0];
                  if (file) void replacePhoto(index, file);
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    select({ kind: "photo", index });
                  }
                },
                className: `group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${selectedPhotoIndex === index ? "cursor-move touch-none" : ""}`,
              })}
              renderCellOverlay={(index) => {
                const selected = selectedPhotoIndex === index;
                const empty = !state.photos[index]?.src;
                return (
                  <>
                    {empty && (
                      <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-stone-600">
                        <Icon name="plus" className="size-6" />
                        <span className="text-xs font-medium">Добавить фото</span>
                      </span>
                    )}
                    <span className={`pointer-events-none absolute inset-0 rounded-[inherit] ring-inset ${dropTarget === index ? "bg-amber-300/30 ring-4 ring-amber-300" : selected ? "ring-[3px] ring-amber-300" : "ring-white/80 group-hover:ring-2"}`} />
                    {loadingPhoto === index && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/60" role="status" aria-label="Загрузка фото">
                        <span className="size-7 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
                      </span>
                    )}
                    {selected && loadingPhoto !== index && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => openPicker({ mode: "cell", index })}
                        className="absolute bottom-2 left-1/2 inline-flex min-h-9 -translate-x-1/2 items-center gap-1 rounded-full bg-stone-950/85 px-3 text-xs font-medium whitespace-nowrap text-white shadow"
                      >
                        <Icon name="upload" className="size-3.5" /> {empty ? "Добавить" : "Заменить"}
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
                      select({ kind: "text", id: t.id });
                    }
                  },
                  className: `cursor-move touch-none select-none ${t.text.trim() ? "" : "min-w-12 min-h-6 outline-1 outline-dashed outline-stone-400"} ${
                    selected ? "outline-2 outline-offset-2 outline-amber-300 outline-dashed" : "hover:outline-2 hover:outline-offset-2 hover:outline-white/90"
                  }`,
                };
              }}
            />
          </div>
          <p className="mx-auto mt-3 hidden max-w-3xl text-center text-xs text-stone-500 sm:block">
            Перетаскивайте фото и тексты прямо на коллаже. Ctrl+Z — отменить, Esc — снять выделение.
          </p>
        </section>

        {sheetOpen && <div aria-hidden onClick={() => setSheetOpen(false)} className="fixed inset-0 z-40 bg-stone-950/40 lg:hidden" />}
        <aside
          aria-label="Настройки"
          className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[52dvh] flex-col rounded-t-3xl bg-stone-50 text-stone-900 [color-scheme:light] shadow-2xl transition-transform duration-300 motion-reduce:transition-none lg:sticky lg:top-24 lg:z-auto lg:col-start-1 lg:row-start-1 lg:max-h-[calc(100dvh-7rem)] lg:translate-y-0 lg:self-start lg:rounded-2xl ${
            sheetOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex items-center gap-1 border-b border-stone-200 px-3 pt-2 pb-2">
            <div role="tablist" aria-label="Разделы настроек" className="flex flex-1 gap-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm ${tab === t.id ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-200"}`}
                >
                  <Icon name={t.icon} className="size-4" /> {t.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setSheetOpen(false)} aria-label="Скрыть настройки" className="inline-flex size-11 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-200 lg:hidden">
              <Icon name="close" />
            </button>
          </div>
          <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {panel}
          </div>
        </aside>
      </main>

      <nav aria-label="Действия" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-stone-800 bg-stone-950/95 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {bottomActions.map((a) => {
          const active = sheetOpen && tab === a.id;
          return (
          <button key={a.id} type="button" onClick={() => runAction(a.id)} aria-pressed={active} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] ${active ? "text-amber-300" : "text-stone-300"} active:bg-stone-800`}>
            <Icon name={a.icon} className="size-5" />
            {a.label}
          </button>
          );
        })}
      </nav>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {dialog === "reset" && (
        <Modal
          title="Сбросить коллаж?"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button type="button" className={ui.secondary} onClick={() => setDialog(null)}>Отмена</button>
              <button type="button" className={ui.primary} onClick={resetTemplate}>Сбросить</button>
            </>
          }
        >
          <p className="text-sm text-stone-600">Фото, тексты, макет и оформление вернутся к шаблону «{template.title}». Сброс можно отменить кнопкой «Назад».</p>
        </Modal>
      )}
      {dialog === "export" && <ExportDialog getRoot={getRoot} fileName={meta.name.replace(/[^\p{L}\p{N}-]+/gu, "-") || template.id} onClose={() => setDialog(null)} notify={notify} />}
      {dialog === "gift" && <GiftDialog template={template} state={state} onClose={() => setDialog(null)} notify={notify} />}

      <ToastList toasts={toasts} />
    </div>
  );
}
