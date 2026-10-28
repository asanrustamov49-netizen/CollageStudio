"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { createProject } from "@/store/projects";

/** Создаёт проект из шаблона и открывает его в редакторе. */
export function CreateProjectButton({ templateId, className = ui.accent, label = "Создать проект" }: { templateId: string; className?: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function create() {
    setBusy(true);
    setError(null);
    const id = createProject(templateId);
    if (!id) {
      setBusy(false);
      setError("Не удалось создать проект.");
      return;
    }
    router.push(`/projects/${id}`);
  }

  return (
    <>
      <button type="button" onClick={create} disabled={busy} className={className}>
        <Icon name="plus" className="size-4" /> {busy ? "Создаём…" : label}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-400">
          {error}
        </span>
      )}
    </>
  );
}
