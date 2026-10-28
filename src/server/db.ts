import { promises as fs } from "node:fs";
import path from "node:path";
import type { CollageState } from "@/types/collage";

/**
 * Простое файловое хранилище: один JSON-файл и папка загрузок в `.data/`.
 * Записи идут по очереди и атомарно (временный файл + rename).
 * Подходит для одного процесса `next start`; на бессерверном хостинге
 * (например, Vercel) файловая система не сохраняется — там нужна настоящая БД.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

export interface Session {
  tokenHash: string;
  userId: string;
  expiresAt: number;
}

export interface StoredProject {
  id: string;
  userId: string;
  templateId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  state: CollageState;
}

export interface StoredGift {
  id: string;
  userId: string;
  createdAt: number;
  templateId: string;
  to: string;
  message: string;
  track: string | null;
  audioId: string | null;
  state: CollageState;
}

export interface Upload {
  id: string;
  userId: string;
  kind: "image" | "audio";
  mime: string;
  size: number;
  createdAt: number;
}

interface Db {
  users: User[];
  sessions: Session[];
  projects: StoredProject[];
  favorites: Record<string, string[]>;
  gifts: StoredGift[];
  uploads: Upload[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const empty = (): Db => ({ users: [], sessions: [], projects: [], favorites: {}, gifts: [], uploads: [] });

let cache: Db | null = null;
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Db> {
  if (cache) return cache;
  try {
    cache = { ...empty(), ...JSON.parse(await fs.readFile(DB_FILE, "utf8")) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    cache = empty();
  }
  return cache!;
}

export async function read<T>(fn: (db: Db) => T): Promise<T> {
  return fn(await load());
}

export function write<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = fn(db);
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db));
    await fs.rename(tmp, DB_FILE);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function uploadPath(id: string) {
  return path.join(UPLOAD_DIR, id);
}
