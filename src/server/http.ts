import { currentUser } from "./auth";
import type { User } from "./db";

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export const fail = (error: string, status: number) => json({ error }, status);

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return (
      new URL(origin).host ===
      (request.headers.get("x-forwarded-host") ?? request.headers.get("host"))
    );
  } catch {
    return false;
  }
}

export function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local"
  );
}

export async function readJson(
  request: Request,
  maxBytes = 256 * 1024,
): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try {
    const value = JSON.parse(text);
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? value
      : null;
  } catch {
    return null;
  }
}

export async function requireUser(
  request: Request,
  mutating = true,
): Promise<User | Response> {
  if (mutating && !sameOrigin(request)) return fail("Запрос отклонён.", 403);
  const user = await currentUser();
  return user ?? fail("Нужно войти в аккаунт.", 401);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PASSWORD_MIN = 8;
