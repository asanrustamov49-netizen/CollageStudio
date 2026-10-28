/** Клиент для API приложения: единый разбор ошибок и сообщение при недоступном сервере. */

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: typeof init.body === "string" ? { "Content-Type": "application/json", ...init.headers } : init.headers,
    });
  } catch {
    throw new ApiError("Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.", 0);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(data.error ?? "Сервер не ответил. Попробуйте позже.", res.status);
  return data as T;
}

/** Загружает фото или песню в аккаунт и возвращает адрес файла. */
export async function uploadFile(file: Blob, name = "file"): Promise<string> {
  const form = new FormData();
  form.append("file", file, name);
  const { url } = await api<{ url: string }>("/api/uploads", { method: "POST", body: form });
  return url;
}
