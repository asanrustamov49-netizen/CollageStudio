"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TemplatePreview } from "@/components/TemplatePreview";
import { Icon } from "@/components/ui/Icon";
import { getInitialState, getTemplateById } from "@/data/templates";
import { Logo } from "@/components/ui/Logo";
import { ui } from "@/components/ui/styles";
import { login, register } from "@/store/account";

const showcase = getTemplateById("little-moments")!;
const perks = ["Проекты и избранное — на любом устройстве", "Свои фото и песня в подарках по QR-коду", "Короткие ссылки, которые можно удалить в любой момент"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const darkField =
  "mt-1 block min-h-12 w-full rounded-xl border border-stone-700 bg-stone-900 px-4 text-base text-stone-100 placeholder:text-stone-500 focus:border-amber-300 focus:outline-none aria-[invalid=true]:border-red-500";

/** Вход и регистрация. После успеха — переход на страницу из ?next= (только внутренние адреса). */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get("next") ?? "";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/projects";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errors = {
    name: mode === "register" && !name.trim() ? "Как к вам обращаться?" : null,
    email: !EMAIL_RE.test(email.trim()) ? "Введите email в формате name@example.com" : null,
    password: password.length < 8 ? "Не короче 8 символов" : null,
  };
  const invalid = Object.values(errors).some(Boolean);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось. Попробуйте ещё раз.");
      setBusy(false);
    }
  }

  const field = (key: keyof typeof errors) => touched && errors[key];

  return (
    <div className="grid flex-1 bg-stone-950 text-stone-100 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col">
      <header className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 md:px-10">
        <Link href="/" aria-label="Collage Studio — на главную">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <p className="text-xs tracking-[0.2em] text-amber-300 uppercase">{mode === "login" ? "С возвращением" : "Новый аккаунт"}</p>
        <h1 className="mt-2 font-display text-4xl">{mode === "login" ? "Вход" : "Создайте аккаунт"}</h1>
        <p className="mt-2 text-sm text-stone-400">
          {mode === "login"
            ? "Проекты, избранное и подарки ждут вас на любом устройстве."
            : "Проекты и избранное будут доступны с любого устройства, а в подарки попадут ваши фото и своя песня."}
        </p>
        <form onSubmit={submit} noValidate className="mt-8 space-y-4">
          {mode === "register" && (
            <label className="block">
              <span className="text-sm text-stone-300">Имя</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={40} aria-invalid={Boolean(field("name"))} className={darkField} />
              {field("name") && <span className="mt-1 block text-xs text-red-400">{errors.name}</span>}
            </label>
          )}
          <label className="block">
            <span className="text-sm text-stone-300">Email</span>
            <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={Boolean(field("email"))} className={darkField} />
            {field("email") && <span className="mt-1 block text-xs text-red-400">{errors.email}</span>}
          </label>
          <label className="block">
            <span className="text-sm text-stone-300">Пароль</span>
            <span className="relative block">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-invalid={Boolean(field("password"))}
                className={`${darkField} pr-12`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} className="absolute top-1/2 right-1 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 hover:text-white">
                <Icon name="eye" className="size-5" />
              </button>
            </span>
            {field("password") ? <span className="mt-1 block text-xs text-red-400">{errors.password}</span> : mode === "register" && <span className="mt-1 block text-xs text-stone-500">Не короче 8 символов</span>}
          </label>
          {error && (
            <p role="alert" className="flex gap-2 rounded-xl bg-red-950/60 p-3 text-sm text-red-200 ring-1 ring-red-900">
              <Icon name="alert" className="size-4" /> {error}
            </p>
          )}
          <button type="submit" disabled={busy} className={`${ui.accent} w-full`}>
            {busy ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-400">
          {mode === "login" ? "Впервые здесь? " : "Уже есть аккаунт? "}
          <Link href={`${mode === "login" ? "/register" : "/login"}${nextParam ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-amber-300 underline-offset-2 hover:underline">
            {mode === "login" ? "Создать аккаунт" : "Войти"}
          </Link>
        </p>
        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-stone-500">
          <Icon name="check" className="size-4" /> Пароли хранятся только в виде хеша scrypt
        </p>
        <p className="mt-2 text-center text-xs text-stone-500">
          Можно и без аккаунта: <Link href="/collages" className="underline">проекты сохранятся на этом устройстве</Link>.
        </p>
      </main>
      </div>
      <aside aria-hidden className="relative hidden overflow-hidden border-l border-stone-800 bg-[#100d0b] lg:flex lg:flex-col lg:justify-center lg:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_60%_30%,rgba(252,211,77,0.14),transparent)]" />
        <div className="relative mx-auto w-full max-w-lg">
          <div className="rotate-2 overflow-hidden rounded-2xl shadow-2xl ring-1 shadow-black/60 ring-stone-800">
            <TemplatePreview template={showcase} state={getInitialState(showcase)} sizes="40vw" eager />
          </div>
          <ul className="mt-10 space-y-3 text-stone-300">
            {perks.map((p) => (
              <li key={p} className="flex gap-3">
                <Icon name="check" className="size-5 text-amber-300" /> {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
