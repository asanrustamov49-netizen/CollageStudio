import { parseGift } from "@/lib/gift";
import { newId } from "@/server/auth";
import { read, write } from "@/server/db";
import { fail, json, readJson, requireUser } from "@/server/http";

/** Подарки текущего пользователя (без содержимого). */
export async function GET(request: Request) {
  const user = await requireUser(request, false);
  if (user instanceof Response) return user;
  const gifts = await read((db) =>
    db.gifts
      .filter((g) => g.userId === user.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(({ id, to, templateId, createdAt }) => ({ id, to, templateId, createdAt })),
  );
  return json({ gifts });
}

/** Публикует подарок. Свои фото и песня должны принадлежать этому же пользователю. */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const gift = parseGift(await readJson(request), true);
  if (!gift || !gift.to) return fail("Проверьте данные подарка: нужно имя получателя.", 400);
  const uploadIds = [...gift.state.photos.map((p) => p.src), gift.audio ?? ""]
    .filter((src) => src.startsWith("/api/uploads/"))
    .map((src) => src.slice("/api/uploads/".length));
  const owned = await read((db) => uploadIds.every((id) => db.uploads.some((u) => u.id === id && u.userId === user.id)));
  if (!owned) return fail("Некоторые файлы недоступны. Загрузите их заново.", 400);

  const id = newId(8);
  await write((db) => {
    db.gifts.push({
      id,
      userId: user.id,
      createdAt: Date.now(),
      templateId: gift.templateId,
      to: gift.to,
      message: gift.message,
      track: gift.track,
      audioId: gift.audio ? gift.audio.slice("/api/uploads/".length) : null,
      state: gift.state,
    });
  });
  return json({ id }, 201);
}
