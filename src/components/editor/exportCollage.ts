export type ExportFormat = "png" | "jpg" | "pdf";
export const exportSizes = [
  { width: 1600, label: "Для экрана", hint: "1600 px" },
  { width: 2400, label: "Высокое", hint: "2400 px" },
  { width: 3600, label: "Для печати", hint: "3600 px ≈ 30 см при 300 dpi" },
];

export async function renderCollage(
  root: HTMLElement,
  outputWidth: number,
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  if (!root.clientWidth || !root.clientHeight) {
    throw new Error("Коллаж не отображается на экране, экспорт невозможен.");
  }
  const rect = root.getBoundingClientRect();
  const originX = rect.left + root.clientLeft;
  const originY = rect.top + root.clientTop;
  const scale = outputWidth / root.clientWidth;

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
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
        throw new Error(
          `Не удалось загрузить фото ${i + 1}. Замените или удалите его.`,
        );
      }
      const px = Number(photo.dataset.x ?? 50) / 100;
      const py = Number(photo.dataset.y ?? 50) / 100;
      const zoom = Number(photo.dataset.zoom ?? 1);
      const ratio =
        Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
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

    const padX = parseFloat(style.paddingLeft) * scale;
    const padY = parseFloat(style.paddingTop) * scale;
    const fontSize = parseFloat(style.fontSize) * scale;
    const lineHeight =
      (parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.25) *
      scale;
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
    ctx.fillStyle = style.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const maxWidth = w - padX * 2;
    wrapText(ctx, text, maxWidth).forEach((line, n) => {
      ctx.fillText(
        line,
        x + w / 2,
        y + padY + lineHeight * (n + 0.5),
        maxWidth,
      );
    });
  }

  return canvas;
}

export async function exportCollage(
  root: HTMLElement,
  format: ExportFormat,
  outputWidth: number,
): Promise<Blob> {
  const canvas = await renderCollage(root, outputWidth);
  if (format === "png") return toBlob(canvas, "image/png");
  const jpeg = await toBlob(canvas, "image/jpeg", 0.92);
  if (format === "jpg") return jpeg;
  return jpegToPdf(
    new Uint8Array(await jpeg.arrayBuffer()),
    canvas.width,
    canvas.height,
  );
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob?.size
          ? resolve(blob)
          : reject(new Error("Не удалось создать файл.")),
      type,
      quality,
    ),
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const limit = maxWidth * 1.01;
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/(\s+)/)) {
      const candidate = line + word;
      if (ctx.measureText(candidate).width <= limit || !line.trim()) {
        line = candidate;
      } else {
        lines.push(line.trimEnd());
        line = word.trimStart();
      }
      while (ctx.measureText(line).width > limit && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > limit)
          cut--;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

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

function jpegToPdf(jpeg: Uint8Array, width: number, height: number): Blob {
  const k = 842 / Math.max(width, height);
  const pw = +(width * k).toFixed(2);
  const ph = +(height * k).toFixed(2);
  const content = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? enc.encode(chunk) : chunk;
    parts.push(bytes);
    length += bytes.length;
  };
  const object = (n: number, body: string | (string | Uint8Array)[]) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
    (Array.isArray(body) ? body : [body]).forEach(push);
    push("\nendobj\n");
  };

  push("%PDF-1.4\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
  );
  object(4, [
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    jpeg,
    "\nendstream",
  ]);
  object(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const xref = length;
  push(
    `xref\n0 6\n0000000000 65535 f \n${offsets
      .slice(1)
      .map((o) => `${String(o).padStart(10, "0")} 00000 n \n`)
      .join("")}`,
  );
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
