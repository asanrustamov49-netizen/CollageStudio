const OUTPUT_WIDTH = 1600;

/**
 * Рисует коллаж в PNG по раскладке DOM-элементов внутри `root`:
 * ячейки помечены `data-cell`, тексты — `data-text`.
 */
export async function exportCollage(root: HTMLElement): Promise<Blob> {
  await document.fonts.ready;

  if (!root.clientWidth || !root.clientHeight) {
    throw new Error("Коллаж не отображается на экране, экспорт невозможен.");
  }
  const rect = root.getBoundingClientRect();
  const originX = rect.left + root.clientLeft;
  const originY = rect.top + root.clientTop;
  const scale = OUTPUT_WIDTH / root.clientWidth;

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_WIDTH;
  canvas.height = Math.round(root.clientHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Браузер не поддерживает Canvas 2D.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const box = (el: Element) => {
    const r = el.getBoundingClientRect();
    return {
      x: (r.left - originX) * scale,
      y: (r.top - originY) * scale,
      w: r.width * scale,
      h: r.height * scale,
    };
  };

  const cells = root.querySelectorAll<HTMLElement>("[data-cell]");
  for (const [i, cell] of [...cells].entries()) {
    const style = getComputedStyle(cell);
    const { x, y, w, h } = box(cell);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, parseFloat(style.borderTopLeftRadius) * scale);
    ctx.clip();
    ctx.fillStyle = style.backgroundColor;
    ctx.fillRect(x, y, w, h);

    const img = cell.querySelector("img");
    if (img) {
      if (!(await isImageReady(img))) {
        throw new Error(`Не удалось загрузить фото ${i + 1}. Замените его другим изображением.`);
      }
      // Аналог object-fit: cover.
      const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * ratio;
      const dh = img.naturalHeight * ratio;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    }
    ctx.restore();
  }

  for (const el of root.querySelectorAll<HTMLElement>("[data-text]")) {
    const style = getComputedStyle(el);
    const { x, y, w, h } = box(el);
    ctx.fillStyle = style.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, parseFloat(style.borderTopLeftRadius) * scale);
    ctx.fill();

    const padding = parseFloat(style.paddingLeft) * scale;
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${parseFloat(style.fontSize) * scale}px ${style.fontFamily}`;
    ctx.fillStyle = style.color;
    ctx.textBaseline = "middle";
    ctx.fillText(fitText(ctx, el.textContent ?? "", w - padding * 2), x + padding, y + h / 2);
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Не удалось создать PNG."))),
      "image/png",
    ),
  );
}

/** Ждёт загрузки изображения; false, если файл не удалось декодировать. */
function isImageReady(img: HTMLImageElement): Promise<boolean> {
  if (img.complete) return Promise.resolve(img.naturalWidth > 0);
  return new Promise((resolve) => {
    img.addEventListener("load", () => resolve(true), { once: true });
    img.addEventListener("error", () => resolve(false), { once: true });
  });
}

/** Обрезает текст с многоточием, как CSS truncate. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let end = text.length;
  while (end > 0 && ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth) end--;
  return `${text.slice(0, end)}…`;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
