"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
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
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 shadow-xl backdrop:bg-neutral-900/40"
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <div className="mt-4 space-y-4">{children}</div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">{footer}</div>
      </div>
    </dialog>
  );
}

export const buttonStyles = {
  primary:
    "rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40",
  secondary:
    "rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100",
  danger: "mr-auto rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50",
};
