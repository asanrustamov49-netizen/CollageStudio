import { useEffect, useSyncExternalStore } from "react";
import { api, type PublicUser } from "@/lib/api";
import { clearLocalFavorites, syncFavorites } from "./favorites";
import { clearLocalProjects, setProjectSync, syncWithServer } from "./projects";

export type AccountState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "user"; user: PublicUser; sync: "syncing" | "synced" | "error" };

let account: AccountState = { status: "loading" };
let started = false;
const listeners = new Set<() => void>();
const serverState: AccountState = { status: "loading" };

function set(next: AccountState) {
  account = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function signedIn(user: PublicUser) {
  setProjectSync(true);
  set({ status: "user", user, sync: "syncing" });
  try {
    await Promise.all([syncWithServer(), syncFavorites()]);
    set({ status: "user", user, sync: "synced" });
  } catch {
    set({ status: "user", user, sync: "error" });
  }
}

async function init() {
  if (started) return;
  started = true;
  try {
    const { user } = await api<{ user: PublicUser | null }>("/api/auth/me");
    if (user) await signedIn(user);
    else set({ status: "guest" });
  } catch {
    set({ status: "guest" });
  }
}

export function useAccount(): AccountState {
  useEffect(() => {
    void init();
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => account,
    () => serverState,
  );
}

export async function login(email: string, password: string) {
  const { user } = await api<{ user: PublicUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  started = true;
  await signedIn(user);
}

export async function register(name: string, email: string, password: string) {
  const { user } = await api<{ user: PublicUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  started = true;
  await signedIn(user);
}

function signedOut() {
  setProjectSync(false);
  clearLocalProjects();
  clearLocalFavorites();
  set({ status: "guest" });
}

export async function logout() {
  await api("/api/auth/logout", { method: "POST" });
  signedOut();
}

export async function updateName(name: string) {
  const { user } = await api<{ user: PublicUser }>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
  if (account.status === "user") set({ ...account, user });
}

export async function deleteAccount(password: string) {
  await api("/api/auth/me", {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
  signedOut();
}

export async function resync() {
  if (account.status === "user") await signedIn(account.user);
}
