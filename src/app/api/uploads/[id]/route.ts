import { promises as fs } from "node:fs";
import { read, uploadPath } from "@/server/db";
import { fail } from "@/server/http";

/**
 * Отдаёт загруженный файл. Адрес содержит случайный id (128 бит) и открывается без входа:
 * так фото и песни видны получателю подарка. Поддерживает Range — нужно для аудио в Safari.
 */
export async function GET(request: Request, { params }: RouteContext<"/api/uploads/[id]">) {
  const { id } = await params;
  if (!/^[\w-]{16,32}$/.test(id)) return fail("Не найдено.", 404);
  const meta = await read((db) => db.uploads.find((u) => u.id === id));
  if (!meta) return fail("Не найдено.", 404);
  let data: Buffer;
  try {
    data = await fs.readFile(uploadPath(id));
  } catch {
    return fail("Файл недоступен.", 404);
  }
  const headers: Record<string, string> = {
    "Content-Type": meta.mime,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    const size = data.length;
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(new Uint8Array(data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Length": String(data.length) } });
}
