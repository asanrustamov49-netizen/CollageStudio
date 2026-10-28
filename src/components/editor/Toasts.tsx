"use client";

import { useCallback, useState } from "react";

type ToastKind = "success" | "error";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let nextId = 0;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, kind: ToastKind = "success") => {
    const id = ++nextId;
    setToasts((list) => [...list.slice(-2), { id, kind, message }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), kind === "error" ? 6000 : 3000);
  }, []);

  return { toasts, notify };
}

export function ToastList({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] lg:bottom-4 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <p
          key={t.id}
          className={`max-w-md rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg ${
            t.kind === "error" ? "bg-red-600 text-white" : "bg-neutral-900 text-white"
          }`}
        >
          {t.kind === "success" ? "✓ " : "⚠ "}
          {t.message}
        </p>
      ))}
    </div>
  );
}
