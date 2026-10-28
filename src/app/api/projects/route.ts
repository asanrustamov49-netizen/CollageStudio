import { read } from "@/server/db";
import { json, requireUser } from "@/server/http";

/** Проекты текущего пользователя. */
export async function GET(request: Request) {
  const user = await requireUser(request, false);
  if (user instanceof Response) return user;
  const projects = await read((db) =>
    db.projects.filter((p) => p.userId === user.id).map(({ userId: _userId, ...p }) => (void _userId, p)),
  );
  return json({ projects });
}
