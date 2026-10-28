import { getInitialState, getTemplateById } from "@/data/templates";
import { parseState } from "@/lib/collageState";
import { write } from "@/server/db";
import { fail, json, readJson, requireUser } from "@/server/http";

const ID_RE = /^[\w-]{6,40}$/;

/** Создаёт или обновляет проект. Чужой проект с тем же id недоступен. */
export async function PUT(request: Request, { params }: RouteContext<"/api/projects/[id]">) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const { id } = await params;
  if (!ID_RE.test(id)) return fail("Некорректный id.", 400);
  const body = await readJson(request);
  const template = typeof body?.templateId === "string" ? getTemplateById(body.templateId) : undefined;
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : "";
  if (!template || !name) return fail("Некорректный проект.", 400);
  const parsed = parseState(body!.state, getInitialState(template));
  if (!parsed || parsed.photos.some((p) => p.src?.startsWith("idb:"))) return fail("Некорректное состояние коллажа.", 400);
  const state = { ...parsed, photos: parsed.photos.map((p) => ({ ...p, src: p.src ?? "" })) };
  const now = Date.now();
  const createdAt = typeof body!.createdAt === "number" ? Math.min(body!.createdAt, now) : now;
  const updatedAt = typeof body!.updatedAt === "number" ? Math.min(body!.updatedAt, now) : now;

  const result = await write((db) => {
    const existing = db.projects.find((p) => p.id === id);
    if (existing && existing.userId !== user.id) return "forbidden" as const;
    if (existing) Object.assign(existing, { name, templateId: template.id, updatedAt, state });
    else db.projects.push({ id, userId: user.id, templateId: template.id, name, createdAt, updatedAt, state });
    return "ok" as const;
  });
  return result === "ok" ? json({ ok: true }) : fail("Проект не найден.", 404);
}

export async function DELETE(request: Request, { params }: RouteContext<"/api/projects/[id]">) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const { id } = await params;
  await write((db) => {
    db.projects = db.projects.filter((p) => !(p.id === id && p.userId === user.id));
  });
  return json({ ok: true });
}
