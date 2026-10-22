"use client";

import { useCallback, useEffect, useRef } from "react";

/** Создаёт object URL для локальных файлов и освобождает их при размонтировании. */
export function useObjectUrls() {
  const urlsRef = useRef(new Set<string>());

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const create = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    urlsRef.current.add(url);
    return url;
  }, []);

  const revoke = useCallback((url: string) => {
    URL.revokeObjectURL(url);
    urlsRef.current.delete(url);
  }, []);

  return { create, revoke };
}
