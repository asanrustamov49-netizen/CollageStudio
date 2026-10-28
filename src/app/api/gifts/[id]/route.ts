import { read, write } from "@/server/db";
import { fail, json, requireUser } from "@/server/http";

/** Публичное чтение подарка по ссылке: получателю аккаунт не нужен. */
export async function GET(_request: Request, { params }: RouteContext<"/api/gifts/[id]">) {
  const { id } = await params;
  const gift = await read((db) => db.gifts.find((g) => g.id === id));
  if (!gift) return fail("Подарок не найден или удалён.", 404);
  return json({
    gift: {
      templateId: gift.templateId,
      to: gift.to,
      message: gift.message,
      track: gift.track,
      audio: gift.audioId ? `/api/uploads/${gift.audioId}` : null,
      state: gift.state,
    },
  });
}

export async function DELETE(request: Request, { params }: RouteContext<"/api/gifts/[id]">) {
  const user = await requireUser(request);
  if (user instanceof Response) return user;
  const { id } = await params;
  const removed = await write((db) => {
    const before = db.gifts.length;
    db.gifts = db.gifts.filter((g) => !(g.id === id && g.userId === user.id));
    return before !== db.gifts.length;
  });
  return removed ? json({ ok: true }) : fail("Подарок не найден.", 404);
}
