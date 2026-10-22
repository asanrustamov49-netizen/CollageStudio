"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { TemplatePreview } from "@/components/TemplatePreview";
import { getCategoryHref, getFontFamily, getInitialTexts } from "@/data/templates";
import type { CollageTemplate, CollageText } from "@/types/collage";
import { downloadBlob, exportCollage } from "./exportCollage";
import { PhotoModal } from "./PhotoModal";
import { TextModal } from "./TextModal";
import { useObjectUrls } from "./useObjectUrls";

type Selection = { kind: "photo"; index: number } | { kind: "text"; id: string } | null;

const textPositions: Record<CollageText["position"], string> = {
  top: "top-4 left-4",
  bottom: "bottom-4 right-4",
};

export function CollageEditor({ template }: { template: CollageTemplate }) {
  const photoUrls = useObjectUrls();
  const [photos, setPhotos] = useState<Record<number, string>>({});
  const [texts, setTexts] = useState(() => getInitialTexts(template));
  const [selection, setSelection] = useState<Selection>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const collageRef = useRef<HTMLDivElement>(null);

  const selectedText =
    selection?.kind === "text" ? texts.find((t) => t.id === selection.id) : undefined;

  function savePhoto(index: number, file: File) {
    const previous = photos[index];
    if (previous) photoUrls.revoke(previous);
    setPhotos({ ...photos, [index]: photoUrls.create(file) });
    setSelection(null);
  }

  function saveText(updated: CollageText) {
    setTexts(texts.map((t) => (t.id === updated.id ? updated : t)));
    setSelection(null);
  }

  function deleteText(id: string) {
    setTexts(texts.filter((t) => t.id !== id));
    setSelection(null);
  }

  async function handleDownload() {
    if (!collageRef.current) return;
    setExporting(true);
    setExportError(null);
    try {
      downloadBlob(await exportCollage(collageRef.current), `${template.id}.png`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Не удалось экспортировать коллаж.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <header className="flex items-center gap-4 border-b border-neutral-200 bg-white px-4 py-4 md:px-10">
        <Link
          href={getCategoryHref(template.category)}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          ← Каталог
        </Link>
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">{template.title}</h1>
        <button
          type="button"
          onClick={handleDownload}
          disabled={exporting}
          className="ml-auto rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
        >
          {exporting ? "Exporting…" : "Download"}
        </button>
      </header>

      <main className="flex-1 px-4 py-6 md:px-10 md:py-10">
        <p className="mb-4 text-sm text-neutral-500">
          Нажмите на фото, чтобы заменить его, или на текст, чтобы отредактировать.
        </p>
        {exportError && (
          <p role="alert" className="mx-auto mb-4 max-w-3xl rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {exportError}
          </p>
        )}
        <div ref={collageRef} className="relative mx-auto max-w-3xl overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
          <TemplatePreview
            template={template}
            renderCell={(index) => (
              <button
                type="button"
                onClick={() => setSelection({ kind: "photo", index })}
                aria-label={`Фото ${index + 1}: заменить`}
                className="group absolute inset-0 flex items-center justify-center"
              >
                {photos[index] ? (
                  <Image src={photos[index]} alt="" fill unoptimized className="object-cover" />
                ) : (
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-neutral-600">
                    + Фото
                  </span>
                )}
                <span className="absolute inset-0 ring-neutral-900 ring-inset group-hover:ring-2" />
              </button>
            )}
          />
          {texts.map((t) => (
            <button
              key={t.id}
              type="button"
              data-text
              onClick={() => setSelection({ kind: "text", id: t.id })}
              className={`absolute ${textPositions[t.position]} max-w-[80%] truncate rounded-md bg-white/85 px-3 py-1.5 text-left text-lg shadow-sm hover:ring-2 hover:ring-neutral-900`}
              style={{ fontFamily: getFontFamily(t.fontId), color: t.color }}
            >
              {t.text}
            </button>
          ))}
        </div>
      </main>

      {selection?.kind === "photo" && (
        <PhotoModal
          onSave={(file) => savePhoto(selection.index, file)}
          onCancel={() => setSelection(null)}
        />
      )}
      {selectedText && (
        <TextModal
          key={selectedText.id}
          text={selectedText}
          onSave={saveText}
          onDelete={() => deleteText(selectedText.id)}
          onCancel={() => setSelection(null)}
        />
      )}
    </div>
  );
}
