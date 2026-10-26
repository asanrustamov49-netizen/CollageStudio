const OUTPUT_WIDTH = 2400;

/**
 * Рисует коллаж в PNG по раскладке DOM-элементов внутри `root`:
 * ячейки помечены `data-cell`, фото — `data-photo` с исходным файлом
 * и кадром в `data-src`/`data-x`/`data-y`/`data-zoom`, тексты — `data-text`.
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
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = getComputedStyle(root).backgroundColor || "#ffffff";
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

    const photo = cell.querySelector<HTMLImageElement>("img[data-photo]");
    if (photo) {
      const img = await loadImage(photo.dataset.src ?? photo.currentSrc);
      if (!img) {
        throw new Error(`Не удалось загрузить фото ${i + 1}. Замените его другим изображением.`);
      }
      // Аналог object-fit: cover + object-position и scale(zoom) с transform-origin в той же точке.
      const px = Number(photo.dataset.x ?? 50) / 100;
      const py = Number(photo.dataset.y ?? 50) / 100;
      const zoom = Number(photo.dataset.zoom ?? 1);
      const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
      const dw = img.naturalWidth * ratio;
      const dh = img.naturalHeight * ratio;
      ctx.drawImage(img, x + (w - dw) * px, y + (h - dh) * py, dw, dh);
    }
    ctx.restore();
  }

  for (const el of root.querySelectorAll<HTMLElement>("[data-text]")) {
    const text = el.textContent ?? "";
    if (!text.trim()) continue;
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
    const maxWidth = w - padding * 2;
    // Canvas меряет шрифт чуть иначе, чем браузер: целиком видимый текст рисуем без обрезки, слегка сжимая.
    const truncated = el.scrollWidth > el.clientWidth + 1;
    if (truncated) ctx.fillText(fitText(ctx, text, maxWidth), x + padding, y + h / 2);
    else ctx.fillText(text, x + padding, y + h / 2, maxWidth);
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob?.size ? resolve(blob) : reject(new Error("Не удалось создать PNG."))),
      "image/png",
    ),
  );
}

/** Загружает исходный файл фото; null, если его не удалось декодировать. */
async function loadImage(src: string): Promise<HTMLImageElement | null> {
  const img = new Image();
  img.src = src;
  try {
    await img.decode();
    return img.naturalWidth > 0 ? img : null;
  } catch {
    return null;
  }
}

/** Обрезает текст с многоточием, как CSS truncate. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  // Допуск на субпиксельные расхождения измерений Canvas и CSS.
  if (ctx.measureText(text).width <= maxWidth * 1.01) return text;
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
