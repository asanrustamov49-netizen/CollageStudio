"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/editor/Modal";
import { ToastList, useToasts } from "@/components/editor/Toasts";
import { MyGifts } from "@/components/gift/MyGifts";
import { PageHeader } from "@/components/shell/PageHeader";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { deleteAccount, logout, resync, updateName, useAccount } from "@/store/account";
import { useFavorites } from "@/store/favorites";
import { useProjects } from "@/store/projects";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

function Stat({ href, icon, label, value }: { href: string; icon: IconName; label: string; value: number | string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl bg-stone-900 p-4 ring-1 ring-stone-800 transition-colors hover:ring-stone-600">
      <span className="flex size-10 items-center justify-center rounded-xl bg-stone-800 text-amber-300">
        <Icon name={icon} />
      </span>
      <span>
        <span className="block font-display text-2xl leading-none">{value}</span>
        <span className="text-xs text-stone-500">{label}</span>
      </span>
    </Link>
  );
}

export function AccountView() {
  const account = useAccount();
  const router = useRouter();
  const projects = useProjects();
  const favorites = useFavorites();
  const { toasts, notify } = useToasts();
  const [name, setName] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (account.status === "loading") {
    return <div className="flex flex-1 items-center justify-center text-stone-400" role="status">Загрузка…</div>;
  }

  if (account.status === "guest") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-stone-900 text-stone-500 ring-1 ring-stone-800">
          <Icon name="user" className="size-8" />
        </span>
        <h1 className="font-display text-3xl">Вы не вошли</h1>
        <p className="max-w-sm text-sm text-stone-400">Войдите, чтобы проекты и избранное были доступны с любого устройства, а в подарки попадали ваши фото и своя песня.</p>
        <div className="flex gap-2">
          <Link href="/login?next=/account" className={ui.accent}>Войти</Link>
          <Link href="/register?next=/account" className={ui.darkSecondary}>Создать аккаунт</Link>
        </div>
      </main>
    );
  }

  const { user, sync } = account;
  const shownName = name ?? user.name;

  async function saveName() {
    const trimmed = shownName.trim();
    if (!trimmed) {
      setName(null);
      return notify("Имя не может быть пустым", "error");
    }
    if (trimmed === user.name) return setName(null);
    try {
      await updateName(trimmed);
      setName(null);
      notify("Имя сохранено");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Не удалось сохранить имя", "error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl min-w-0 flex-1 space-y-8 px-4 py-6 md:px-10 md:py-10">
      <PageHeader
        eyebrow="Профиль"
        title={user.name}
        subtitle={`${user.email} · с ${dateFormat.format(user.createdAt)}`}
        actions={
          <button
            type="button"
            className={ui.darkSecondary}
            onClick={async () => {
              try {
                await logout();
                router.push("/");
              } catch (e) {
                notify(e instanceof Error ? e.message : "Не удалось выйти", "error");
              }
            }}
          >
            Выйти
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat href="/projects" icon="folder" label="проектов" value={projects?.length ?? "—"} />
        <Stat href="/favorites" icon="heart" label="в избранном" value={favorites?.length ?? "—"} />
        <div className="flex items-center gap-3 rounded-2xl bg-stone-900 p-4 ring-1 ring-stone-800" role="status">
          <span className={`flex size-10 items-center justify-center rounded-xl bg-stone-800 ${sync === "error" ? "text-red-400" : "text-emerald-400"}`}>
            <Icon name={sync === "error" ? "alert" : "check"} />
          </span>
          <span className="text-sm">
            {sync === "syncing" ? "Синхронизация…" : sync === "synced" ? "Всё в аккаунте" : "Ошибка синхронизации"}
            {sync === "error" && (
              <button type="button" onClick={() => void resync()} className="ml-2 text-amber-300 underline">Повторить</button>
            )}
          </span>
        </div>
      </section>

      <section className="rounded-2xl bg-stone-50 p-5 text-stone-900 [color-scheme:light]">
        <h2 className="font-display text-xl">Данные профиля</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={ui.label}>Имя</span>
            <input value={shownName} maxLength={40} onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} className={ui.field} />
          </label>
          <label className="block">
            <span className={ui.label}>Email</span>
            <input value={user.email} readOnly aria-readonly className={`${ui.field} bg-stone-100 text-stone-500`} />
          </label>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl">Мои подарки</h2>
          <Link href="/gifts" className="text-sm text-amber-300 hover:underline">Раздел «Подарки» →</Link>
        </div>
        <MyGifts notify={notify} />
      </section>

      <section className="rounded-2xl p-5 ring-1 ring-red-900/60">
        <h2 className="font-display text-xl text-red-300">Удаление аккаунта</h2>
        <p className="mt-1 text-sm text-stone-400">Удалятся все проекты, подарки и загруженные файлы. Ссылки на подарки перестанут открываться.</p>
        <button type="button" onClick={() => setDeleting(true)} className={`${ui.darkSecondary} mt-4 border-red-900 text-red-300 hover:bg-red-950`}>
          Удалить аккаунт
        </button>
      </section>

      {deleting && (
        <Modal
          title="Удалить аккаунт навсегда?"
          onClose={() => setDeleting(false)}
          footer={
            <>
              <button type="button" className={ui.secondary} onClick={() => setDeleting(false)}>Отмена</button>
              <button
                type="button"
                disabled={!password}
                className={`${ui.primary} bg-red-700 hover:bg-red-600`}
                onClick={async () => {
                  try {
                    await deleteAccount(password);
                    router.push("/");
                  } catch (e) {
                    setDeleteError(e instanceof Error ? e.message : "Не удалось удалить аккаунт");
                  }
                }}
              >
                Удалить всё
              </button>
            </>
          }
        >
          <p className="text-sm text-stone-600">Это действие нельзя отменить. Введите пароль для подтверждения.</p>
          <label className="block">
            <span className={ui.label}>Пароль</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={ui.field} />
          </label>
          {deleteError && <p role="alert" className="text-sm text-red-700">{deleteError}</p>}
        </Modal>
      )}
      <ToastList toasts={toasts} />
    </main>
  );
}
