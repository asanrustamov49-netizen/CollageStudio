import { promises as fs } from "node:fs";
import { currentUser, endSession, publicUser, verifyPassword } from "@/server/auth";
import { read, uploadPath, write } from "@/server/db";
import { fail, json, readJson, requireUser } from "@/server/http";

export async function GET() {
  const user = await currentUser();
  if (!user) return json({ user: null });
  const stats = await read((db) => ({
    projects: db.projects.filter((p) => p.userId === user.id).length,
    gifts: db.gifts.filter((g) => g.userId === user.id).length,
  }));
  return json({ user: publicUser(user), stats });
}

/** Смена имени. */
export async function PATCH(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await readJson(request, 2048);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 40) return fail("Укажите имя до 40 символов.", 400);
  const updated = await write((db) => {
    const u = db.users.find((x) => x.id === user.id)!;
    u.name = name;
    return u;
  });
  return json({ user: publicUser(updated) });
}

/** Удаление аккаунта со всеми проектами, подарками и файлами. Требует пароль. */
export async function DELETE(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await readJson(request, 2048);
  if (typeof body?.password !== "string" || !(await verifyPassword(body.password, user.passwordHash))) {
    return fail("Неверный пароль.", 401);
  }
  const files = await write((db) => {
    const own = db.uploads.filter((u) => u.userId === user.id).map((u) => u.id);
    db.users = db.users.filter((u) => u.id !== user.id);
    db.sessions = db.sessions.filter((s) => s.userId !== user.id);
    db.projects = db.projects.filter((p) => p.userId !== user.id);
    db.gifts = db.gifts.filter((g) => g.userId !== user.id);
    db.uploads = db.uploads.filter((u) => u.userId !== user.id);
    delete db.favorites[user.id];
    return own;
  });
  await Promise.all(files.map((id) => fs.rm(uploadPath(id), { force: true })));
  await endSession();
  return json({ ok: true });
}
