import { endSession } from "@/server/auth";
import { fail, json, sameOrigin } from "@/server/http";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Запрос отклонён.", 403);
  await endSession();
  return json({ ok: true });
}
