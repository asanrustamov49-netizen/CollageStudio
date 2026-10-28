"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { downloadBlob, exportCollage, exportSizes, renderCollage, type ExportFormat } from "./exportCollage";
import { Modal } from "./Modal";

const formats: { id: ExportFormat; label: string; hint: string }[] = [
  { id: "png", label: "PNG", hint: "Без потерь" },
  { id: "jpg", label: "JPG", hint: "Меньше вес" },
  { id: "pdf", label: "PDF", hint: "Для печати" },
];

interface ExportDialogProps {
  getRoot: () => HTMLElement | null;
  fileName: string;
  onClose: () => void;
  notify: (message: string, kind?: "success" | "error") => void;
}

export function ExportDialog({ getRoot, fileName, onClose, notify }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [width, setWidth] = useState(exportSizes[1].width);
  const [preview, setPreview] = useState<{ url: string; ratio: number } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Предпросмотр — то же самое изображение, что попадёт в файл, только меньше.
  useEffect(() => {
    let cancelled = false;
    const root = getRoot();
    if (!root) return;
    renderCollage(root, 900)
      .then((canvas) => {
        if (!cancelled) setPreview({ url: canvas.toDataURL("image/jpeg", 0.85), ratio: canvas.height / canvas.width });
      })
      .catch((e) => !cancelled && setPreviewError(e instanceof Error ? e.message : "Не удалось построить предпросмотр."));
    return () => {
      cancelled = true;
    };
  }, [getRoot]);

  async function download() {
    const root = getRoot();
    if (!root) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await exportCollage(root, format, width);
      downloadBlob(blob, `${fileName}.${format}`);
      notify(`Файл ${format.toUpperCase()} сохранён (${(blob.size / 1024 / 1024).toFixed(1)} МБ)`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось экспортировать коллаж.");
    } finally {
      setBusy(false);
    }
  }

  const height = preview ? Math.round(width * preview.ratio) : null;

  return (
    <Modal
      title="Экспорт"
      wide
      onClose={onClose}
      footer={
        <>
          <button type="button" className={ui.secondary} onClick={onClose}>
            Отмена
          </button>
          <button type="button" className={ui.accent} onClick={download} disabled={busy || Boolean(previewError)}>
            <Icon name="download" className="size-4" />
            {busy ? "Готовим файл…" : `Скачать ${format.toUpperCase()}`}
          </button>
        </>
      }
    >
      <div className="grid gap-5 sm:grid-cols-[1fr_15rem]">
        <div className="flex min-h-48 items-center justify-center rounded-2xl bg-stone-200 p-3">
          {previewError ? (
            <p role="alert" className="flex items-center gap-2 text-sm text-red-700">
              <Icon name="alert" /> {previewError}
            </p>
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL предпросмотра
            <img src={preview.url} alt="Предпросмотр итогового файла" className="max-h-[45dvh] w-auto rounded-md shadow-lg" />
          ) : (
            <span className="size-8 animate-spin rounded-full border-2 border-stone-400 border-t-stone-900" aria-label="Строим предпросмотр" />
          )}
        </div>
        <div className="space-y-4">
          <fieldset>
            <legend className={ui.label}>Формат</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {formats.map((f) => (
                <button key={f.id} type="button" aria-pressed={format === f.id} onClick={() => setFormat(f.id)} className={`${format === f.id ? ui.primary : ui.secondary} flex-col gap-0 px-1 py-1.5 leading-tight`}>
                  <span>{f.label}</span>
                  <span className="text-[10px] font-normal opacity-70">{f.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={ui.label}>Размер</legend>
            <div className="mt-2 space-y-2">
              {exportSizes.map((s) => (
                <label key={s.width} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${width === s.width ? "border-stone-900 bg-white" : "border-stone-200"}`}>
                  <input type="radio" name="export-size" checked={width === s.width} onChange={() => setWidth(s.width)} className="size-4 accent-stone-900" />
                  <span className="flex-1">
                    {s.label}
                    <span className="block text-xs text-stone-500">{s.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-800">
              {error}
            </p>
          )}
          {height && (
            <p className="text-xs text-stone-500">
              Итог: {width} × {height} px{format === "pdf" ? ", страница по пропорциям коллажа" : ""}.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
