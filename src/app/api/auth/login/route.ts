import { allowAttempt, publicUser, startSession, verifyPassword } from "@/server/auth";
import { read } from "@/server/db";
import { clientKey, fail, json, readJson, sameOrigin } from "@/server/http";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Запрос отклонён.", 403);
  if (!allowAttempt(`login:${clientKey(request)}`)) return fail("Слишком много попыток. Подождите минуту.", 429);
  const body = await readJson(request, 4096);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const user = await read((db) => db.users.find((u) => u.email === email));
  // Одинаковый ответ для «нет такого email» и «неверный пароль».
  if (!user || !(await verifyPassword(password, user.passwordHash))) return fail("Неверный email или пароль.", 401);
  await startSession(user.id);
  return json({ user: publicUser(user) });
}
