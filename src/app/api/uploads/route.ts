import { promises as fs } from "node:fs";
import { newId } from "@/server/auth";
import { read, UPLOAD_DIR, uploadPath, write } from "@/server/db";
import { LIMITS, sniff } from "@/server/files";
import { fail, json, requireUser } from "@/server/http";

/** Загрузка фото или песни в аккаунт. Тип проверяется по содержимому файла. */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > LIMITS.image + 64 * 1024) return fail("Файл больше 15 МБ.", 413);

  let file: File | null = null;
  try {
    const value = (await request.formData()).get("file");
    file = value instanceof File ? value : null;
  } catch {
    return fail("Не удалось прочитать файл.", 400);
  }
  if (!file || !file.size) return fail("Файл не выбран.", 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) return fail("Поддерживаются JPG, PNG, WebP, GIF, AVIF и песни MP3, M4A, OGG, WAV.", 415);
  if (bytes.length > LIMITS[type.kind]) return fail(type.kind === "image" ? "Фото больше 15 МБ." : "Песня больше 12 МБ.", 413);
  const used = await read((db) => db.uploads.filter((u) => u.userId === user.id).reduce((sum, u) => sum + u.size, 0));
  if (used + bytes.length > LIMITS.quota) return fail("Место в аккаунте закончилось (300 МБ). Удалите старые проекты или подарки.", 413);

  const id = newId(16);
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(uploadPath(id), bytes);
  await write((db) => {
    db.uploads.push({ id, userId: user.id, kind: type.kind, mime: type.mime, size: bytes.length, createdAt: Date.now() });
  });
  return json({ id, url: `/api/uploads/${id}`, kind: type.kind }, 201);
}
