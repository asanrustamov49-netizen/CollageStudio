"use client";

import { useState } from "react";
import { fontOptions, getFontFamily } from "@/data/templates";
import type { CollageText, FontId } from "@/types/collage";
import { Modal, buttonStyles } from "./Modal";

interface TextModalProps {
  text: CollageText;
  onSave: (text: CollageText) => void;
  onDelete: () => void;
  onCancel: () => void;
}

const fieldStyles =
  "mt-1 block w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none";

export function TextModal({ text, onSave, onDelete, onCancel }: TextModalProps) {
  const [draft, setDraft] = useState(text);

  return (
    <Modal
      title="Редактировать текст"
      onClose={onCancel}
      footer={
        <>
          <button type="button" className={buttonStyles.danger} onClick={onDelete}>
            Удалить
          </button>
          <button type="button" className={buttonStyles.secondary} onClick={onCancel}>
            Отмена
          </button>
          <button
            type="button"
            className={buttonStyles.primary}
            disabled={!draft.text.trim()}
            onClick={() => onSave({ ...draft, text: draft.text.trim() })}
          >
            Сохранить
          </button>
        </>
      }
    >
      <label className="block">
        <span className="text-sm text-neutral-600">Текст</span>
        <input
          type="text"
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          className={fieldStyles}
          style={{ fontFamily: getFontFamily(draft.fontId), color: draft.color }}
        />
      </label>
      <div className="flex gap-3">
        <label className="block flex-1">
          <span className="text-sm text-neutral-600">Шрифт</span>
          <select
            value={draft.fontId}
            onChange={(e) => setDraft({ ...draft, fontId: e.target.value as FontId })}
            className={fieldStyles}
          >
            {fontOptions.map((font) => (
              <option key={font.id} value={font.id}>
                {font.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-neutral-600">Цвет</span>
          <input
            type="color"
            value={draft.color}
            onChange={(e) => setDraft({ ...draft, color: e.target.value })}
            className="mt-1 block h-[38px] w-16 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1"
          />
        </label>
      </div>
    </Modal>
  );
}
