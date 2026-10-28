import { getTemplateById } from "@/data/templates";
import { read, write } from "@/server/db";
import { fail, json, readJson, requireUser } from "@/server/http";

export async function GET(request: Request) {
  const user = await requireUser(request, false);
  if (user instanceof Response) return user;
  return json({ ids: await read((db) => db.favorites[user.id] ?? []) });
}

/** Полностью заменяет список избранных шаблонов. */
export async function PUT(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const body = await readJson(request, 8192);
  if (!Array.isArray(body?.ids)) return fail("Некорректный список.", 400);
  const ids = [...new Set(body.ids.filter((id): id is string => typeof id === "string" && Boolean(getTemplateById(id))))];
  await write((db) => {
    db.favorites[user.id] = ids;
  });
  return json({ ids });
}
