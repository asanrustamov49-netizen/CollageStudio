"use client";

import Image from "next/image";
import { skipOptimization } from "@/lib/collageState";
import { useState } from "react";
import type { PhotoSlot } from "@/types/collage";

/**
 * Фото ячейки с кадрированием. Атрибуты data-* читает экспорт в PNG,
 * чтобы нарисовать исходный файл в полном разрешении с тем же кадром.
 */
export function CollagePhoto({ slot, sizes, eager }: { slot: PhotoSlot; sizes: string; eager?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === slot.src) {
    return (
      <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs text-neutral-600">
        Фото не загрузилось
      </span>
    );
  }

  const origin = `${slot.x}% ${slot.y}%`;
  return (
    <Image
      src={slot.src}
      alt=""
      fill
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      draggable={false}
      unoptimized={skipOptimization(slot.src)}
      onError={() => setFailedSrc(slot.src)}
      data-photo
      data-src={slot.src}
      data-x={slot.x}
      data-y={slot.y}
      data-zoom={slot.zoom}
      className="pointer-events-none select-none object-cover"
      style={{ objectPosition: origin, transform: `scale(${slot.zoom})`, transformOrigin: origin }}
    />
  );
}
