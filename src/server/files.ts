export const LIMITS = {
  image: 15 * 1024 * 1024,
  audio: 12 * 1024 * 1024,
  quota: 300 * 1024 * 1024,
};

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

export function sniff(
  bytes: Uint8Array,
): { kind: "image" | "audio"; mime: string } | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return { kind: "image", mime: "image/jpeg" };
  if (ascii(bytes, 1, 3) === "PNG" && bytes[0] === 0x89)
    return { kind: "image", mime: "image/png" };
  if (ascii(bytes, 0, 4) === "GIF8")
    return { kind: "image", mime: "image/gif" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP")
    return { kind: "image", mime: "image/webp" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE")
    return { kind: "audio", mime: "audio/wav" };
  if (ascii(bytes, 0, 4) === "OggS")
    return { kind: "audio", mime: "audio/ogg" };
  if (
    ascii(bytes, 0, 3) === "ID3" ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  )
    return { kind: "audio", mime: "audio/mpeg" };
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (brand === "avif" || brand === "avis")
      return { kind: "image", mime: "image/avif" };
    if (brand.startsWith("M4A") || brand === "mp42" || brand === "isom")
      return { kind: "audio", mime: "audio/mp4" };
  }
  return null;
}
