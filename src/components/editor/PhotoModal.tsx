"use client";

import Image from "next/image";
import { useState } from "react";
import { Modal, buttonStyles } from "./Modal";
import { useObjectUrls } from "./useObjectUrls";

interface PhotoModalProps {
  onSave: (file: File) => void;
  onCancel: () => void;
}

export function PhotoModal({ onSave, onCancel }: PhotoModalProps) {
  const previewUrls = useObjectUrls();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (preview) previewUrls.revoke(preview);
    setFile(selected);
    setPreview(previewUrls.create(selected));
  }

  return (
    <Modal
      title="Заменить фото"
      onClose={onCancel}
      footer={
        <>
          <button type="button" className={buttonStyles.secondary} onClick={onCancel}>
            Отмена
          </button>
          <button
            type="button"
            className={buttonStyles.primary}
            disabled={!file}
            onClick={() => file && onSave(file)}
          >
            Сохранить
          </button>
        </>
      }
    >
      <label className="block">
        <span className="text-sm text-neutral-600">Изображение с компьютера</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="mt-2 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-neutral-200"
        />
      </label>
      {preview && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100">
          <Image src={preview} alt="Предпросмотр" fill unoptimized className="object-contain" />
        </div>
      )}
    </Modal>
  );
}
