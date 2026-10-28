"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/editor/Modal";
import { ToastList, useToasts } from "@/components/editor/Toasts";
import { PopularTemplates } from "@/components/PopularTemplates";
import { TemplatePreview } from "@/components/TemplatePreview";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { getTemplateById } from "@/data/templates";
import { useAccount } from "@/store/account";
import { deleteProject, duplicateProject, renameProject, useProjects, useProjectState, type ProjectMeta } from "@/store/projects";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export function ProjectsView() {
  const projects = useProjects();
  const account = useAccount();
  const { toasts, notify } = useToasts();
  const [renaming, setRenaming] = useState<ProjectMeta | null>(null);
  const [deleting, setDeleting] = useState<ProjectMeta | null>(null);
  const sorted = projects ? [...projects].sort((a, b) => b.updatedAt - a.updatedAt) : null;

  return (
    <div className="flex flex-1 flex-col bg-stone-950 text-stone-100">
      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-800 pb-6">
          <div>
            <h1 className="font-display text-4xl md:text-5xl">Мои проекты</h1>
            <p className="mt-1 text-sm text-stone-400">
              {account.status === "user" ? "Сохраняются автоматически в аккаунте и доступны с любого устройства." : (
                <>
                  Сохраняются на этом устройстве. <Link href="/login?next=/projects" className="text-amber-300 underline-offset-2 hover:underline">Войдите</Link>, чтобы открыть их где угодно.
                </>
              )}
            </p>
          </div>
          <Link href="/collages" className={ui.accent}>
            <Icon name="plus" className="size-4" /> Новый проект
          </Link>
        </header>

        {sorted === null ? (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3" aria-label="Загрузка проектов">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-72 animate-pulse rounded-2xl bg-stone-900" />
            ))}
          </ul>
        ) : sorted.length === 0 ? (
          <>
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-700 px-6 py-16 text-center">
            <Icon name="folder" className="size-10 text-stone-600" />
            <p className="font-display text-2xl">Проектов пока нет</p>
            <p className="max-w-sm text-sm text-stone-400">Выберите шаблон в каталоге — проект появится здесь и будет сохраняться сам.</p>
            <Link href="/collages" className={ui.accent}>
              Открыть каталог
            </Link>
          </div>
          <PopularTemplates title="Начните с популярного" />
          </>
        ) : (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {sorted.map((p) => (
              <li key={p.id}>
                <ProjectCard
                  meta={p}
                  onRename={() => setRenaming(p)}
                  onDelete={() => setDeleting(p)}
                  onDuplicate={async () => {
                    const id = await duplicateProject(p.id);
                    notify(id ? "Копия создана" : "Не удалось создать копию", id ? "success" : "error");
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      {renaming && <RenameDialog meta={renaming} onClose={() => setRenaming(null)} onDone={() => notify("Название сохранено")} />}
      {deleting && (
        <Modal
          title="Удалить проект?"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button type="button" className={ui.secondary} onClick={() => setDeleting(null)}>
                Отмена
              </button>
              <button
                type="button"
                className={`${ui.primary} bg-red-700 hover:bg-red-600`}
                onClick={() => {
                  deleteProject(deleting.id);
                  setDeleting(null);
                  notify("Проект удалён");
                }}
              >
                Удалить навсегда
              </button>
            </>
          }
        >
          <p className="text-sm text-stone-600">«{deleting.name}» и его фото будут удалены из этого браузера. Отменить это нельзя.</p>
        </Modal>
      )}
      <ToastList toasts={toasts} />
    </div>
  );
}

function ProjectCard({ meta, onRename, onDelete, onDuplicate }: { meta: ProjectMeta; onRename: () => void; onDelete: () => void; onDuplicate: () => void }) {
  const state = useProjectState(meta.id);
  const template = getTemplateById(meta.templateId);
  const router = useRouter();
  if (!template) return null;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-stone-900 ring-1 ring-stone-800">
      <Link href={`/projects/${meta.id}`} aria-label={`Открыть «${meta.name}»`} className="block p-2 pb-0">
        <div className="overflow-hidden rounded-xl">
          {state ? <TemplatePreview template={template} state={state} /> : <div className="aspect-[4/3] animate-pulse bg-stone-800" />}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 px-4 pt-3 pb-4">
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl">{meta.name}</h2>
          <p className="text-xs text-stone-500">
            {template.title} · изменён {dateFormat.format(meta.updatedAt)}
          </p>
        </div>
        <div className="mt-auto flex gap-2">
          <button type="button" onClick={() => router.push(`/projects/${meta.id}`)} className={`${ui.accent} flex-1`}>
            Открыть
          </button>
          <button type="button" onClick={onRename} aria-label="Переименовать" title="Переименовать" className={ui.darkIcon}>
            <Icon name="edit" />
          </button>
          <button type="button" onClick={onDuplicate} aria-label="Сделать копию" title="Сделать копию" className={ui.darkIcon}>
            <Icon name="copy" />
          </button>
          <button type="button" onClick={onDelete} aria-label="Удалить" title="Удалить" className={`${ui.darkIcon} hover:border-red-500 hover:text-red-400`}>
            <Icon name="trash" />
          </button>
        </div>
      </div>
    </article>
  );
}

function RenameDialog({ meta, onClose, onDone }: { meta: ProjectMeta; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(meta.name);
  const error = name.trim() ? null : "Введите название.";
  function save() {
    if (error) return;
    renameProject(meta.id, name);
    onDone();
    onClose();
  }
  return (
    <Modal
      title="Переименовать"
      onClose={onClose}
      footer={
        <>
          <button type="button" className={ui.secondary} onClick={onClose}>
            Отмена
          </button>
          <button type="button" className={ui.primary} onClick={save} disabled={Boolean(error)}>
            Сохранить
          </button>
        </>
      }
    >
      <label className="block">
        <span className={ui.label}>Название</span>
        <input autoFocus value={name} maxLength={60} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} aria-invalid={Boolean(error)} className={ui.field} />
        {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
      </label>
    </Modal>
  );
}
