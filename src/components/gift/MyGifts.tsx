"use client";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Modal } from "@/components/editor/Modal";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/components/ui/styles";
import { getTemplateById } from "@/data/templates";
import { api } from "@/lib/api";
import { publishedGiftPath } from "@/lib/gift";
import { useAccount } from "@/store/account";

interface GiftItem {
  id: string;
  to: string;
  templateId: string;
  createdAt: number;
}

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function MyGifts({
  notify,
}: {
  notify: (message: string, kind?: "success" | "error") => void;
}) {
  const account = useAccount();
  const userId = account.status === "user" ? account.user.id : null;
  const [gifts, setGifts] = useState<GiftItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<{
    url: string;
    image: string;
    to: string;
  } | null>(null);
  const [removing, setRemoving] = useState<GiftItem | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    api<{ gifts: GiftItem[] }>("/api/gifts")
      .then((r) => !cancelled && setGifts(r.gifts))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (account.status === "loading")
    return <div className="h-24 animate-pulse rounded-2xl bg-stone-900" />;
  if (account.status === "guest") {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-stone-900 p-5 ring-1 ring-stone-800">
        <Icon name="user" className="size-8 text-stone-500" />
        <p className="min-w-0 flex-1 text-sm text-stone-400">
          Подарки без аккаунта живут только в ссылке, которую вы отправили.
          Войдите, чтобы подарки сохранялись здесь, а в них попадали ваши фото и
          своя песня.
        </p>
        <Link href="/login?next=/gifts" className={ui.accent}>
          Войти
        </Link>
      </div>
    );
  }

  async function showQr(g: GiftItem) {
    const url = `${window.location.origin}${publishedGiftPath(g.id)}`;
    setQr({
      url,
      to: g.to,
      image: await QRCode.toDataURL(url, {
        errorCorrectionLevel: "M",
        margin: 4,
        width: 640,
      }),
    });
  }

  async function remove(g: GiftItem) {
    try {
      await api(`/api/gifts/${g.id}`, { method: "DELETE" });
      setGifts((list) => list?.filter((x) => x.id !== g.id) ?? null);
      notify("Подарок удалён — ссылка больше не откроется");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Не удалось удалить", "error");
    }
    setRemoving(null);
  }

  return (
    <>
      {error ? (
        <p
          role="alert"
          className="rounded-2xl bg-red-950/50 p-4 text-sm text-red-300 ring-1 ring-red-900"
        >
          {error}
        </p>
      ) : gifts === null ? (
        <div className="h-24 animate-pulse rounded-2xl bg-stone-900" />
      ) : gifts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-700 p-8 text-center text-sm text-stone-400">
          Пока нет подарков. Откройте{" "}
          <Link href="/projects" className="text-amber-300 hover:underline">
            проект
          </Link>{" "}
          и нажмите «Подарок».
        </div>
      ) : (
        <ul className="divide-y divide-stone-800 rounded-2xl bg-stone-900 ring-1 ring-stone-800">
          {gifts.map((g) => (
            <li
              key={g.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">
                <Icon name="gift" className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-stone-100">Для: {g.to}</p>
                <p className="text-xs text-stone-500">
                  {getTemplateById(g.templateId)?.title} ·{" "}
                  {dateFormat.format(g.createdAt)}
                </p>
              </div>
              <div className="flex gap-1.5">
                <a
                  href={publishedGiftPath(g.id)}
                  target="_blank"
                  rel="noreferrer"
                  className={ui.darkIcon}
                  aria-label={`Открыть подарок для ${g.to}`}
                  title="Открыть"
                >
                  <Icon name="eye" />
                </a>
                <button
                  type="button"
                  onClick={() => void showQr(g)}
                  className={ui.darkIcon}
                  aria-label={`QR-код подарка для ${g.to}`}
                  title="QR-код"
                >
                  <Icon name="grid" />
                </button>
                <button
                  type="button"
                  onClick={() => setRemoving(g)}
                  className={`${ui.darkIcon} hover:border-red-500 hover:text-red-400`}
                  aria-label={`Удалить подарок для ${g.to}`}
                  title="Удалить"
                >
                  <Icon name="trash" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {qr && (
        <Modal title={`QR для: ${qr.to}`} onClose={() => setQr(null)}>
          <div className="mx-auto w-56 rounded-2xl bg-white p-2 ring-1 ring-stone-200">
            <img
              src={qr.image}
              alt={`QR-код подарка для ${qr.to}`}
              className="block w-full [image-rendering:pixelated]"
            />
          </div>
          <input
            readOnly
            value={qr.url}
            onFocus={(e) => e.target.select()}
            aria-label="Ссылка на подарок"
            className={`${ui.field} font-mono text-xs`}
          />
          <a
            href={qr.image}
            download={`podarok-${qr.to}-qr.png`}
            className={`${ui.secondary} w-full`}
          >
            <Icon name="download" className="size-4" /> Скачать QR (PNG)
          </a>
        </Modal>
      )}
      {removing && (
        <Modal
          title="Удалить подарок?"
          onClose={() => setRemoving(null)}
          footer={
            <>
              <button
                type="button"
                className={ui.secondary}
                onClick={() => setRemoving(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className={`${ui.primary} bg-red-700 hover:bg-red-600`}
                onClick={() => void remove(removing)}
              >
                Удалить
              </button>
            </>
          }
        >
          <p className="text-sm text-stone-600">
            Ссылка и QR-код для «{removing.to}» перестанут работать.
          </p>
        </Modal>
      )}
    </>
  );
}
