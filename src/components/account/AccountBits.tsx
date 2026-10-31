"use client";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useAccount } from "@/store/account";

export function AccountBootstrap() {
  useAccount();
  return null;
}

export function AccountButton({ compact = false }: { compact?: boolean }) {
  const account = useAccount();
  if (account.status === "loading") return <span className="inline-block h-11 w-24 animate-pulse rounded-full bg-stone-800" aria-hidden />;
  if (account.status === "guest") {
    return (
      <Link href="/login" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-700 px-4 text-sm text-stone-200 hover:border-stone-500">
        <Icon name="users" className="size-4" /> Войти
      </Link>
    );
  }
  return (
    <Link href="/account" aria-label={`Аккаунт: ${account.user.name}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-700 py-1 pr-4 pl-1 text-sm text-stone-200 hover:border-stone-500">
      <span className="flex size-9 items-center justify-center rounded-full bg-amber-300 font-semibold text-stone-950">{account.user.name.slice(0, 1).toUpperCase()}</span>
      {!compact && <span className="max-w-28 truncate">{account.user.name}</span>}
    </Link>
  );
}
