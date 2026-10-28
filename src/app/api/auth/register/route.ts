import { allowAttempt, hashPassword, newId, publicUser, startSession } from "@/server/auth";
import { write } from "@/server/db";
import { clientKey, EMAIL_RE, fail, json, PASSWORD_MIN, readJson, sameOrigin } from "@/server/http";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Запрос отклонён.", 403);
  if (!allowAttempt(`register:${clientKey(request)}`, 5)) return fail("Слишком много попыток. Подождите минуту.", 429);
  const body = await readJson(request, 4096);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!name || name.length > 40) return fail("Укажите имя до 40 символов.", 400);
  if (!EMAIL_RE.test(email) || email.length > 120) return fail("Проверьте email.", 400);
  if (password.length < PASSWORD_MIN || password.length > 128) return fail(`Пароль — от ${PASSWORD_MIN} до 128 символов.`, 400);

  const passwordHash = await hashPassword(password);
  const user = await write((db) => {
    if (db.users.some((u) => u.email === email)) return null;
    const created = { id: newId(), name, email, passwordHash, createdAt: Date.now() };
    db.users.push(created);
    return created;
  });
  if (!user) return fail("Аккаунт с таким email уже есть. Войдите.", 409);
  await startSession(user.id);
  return json({ user: publicUser(user) }, 201);
}
