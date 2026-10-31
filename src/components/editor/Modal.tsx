"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ title, onClose, children, footer, wide }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className={`mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-stone-50 p-0 text-stone-900 [color-scheme:light] shadow-2xl backdrop:bg-stone-950/70 backdrop:backdrop-blur-sm sm:m-auto sm:w-[calc(100%-2rem)] sm:rounded-3xl ${
        wide ? "sm:max-w-3xl" : "sm:max-w-md"
      }`}
    >
      <div className="flex max-h-[92dvh] flex-col">
        <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-3">
          <h2 className="flex-1 font-display text-xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="-mr-2 inline-flex size-11 items-center justify-center rounded-full hover:bg-stone-200">
            <Icon name="close" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}

export const buttonStyles = { primary: ui.primary, secondary: ui.secondary, danger: `${ui.danger} mr-auto` };
