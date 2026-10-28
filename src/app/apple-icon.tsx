import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Иконка для экрана «Домой» на iPhone — тот же знак, что в icon.svg. */
export default function AppleIcon() {
  const tile = (left: number, top: number, width: number, height: number, background: string) => (
    <div style={{ position: "absolute", left, top, width, height, background, borderRadius: 14 }} />
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#1c1917", position: "relative", display: "flex" }}>
        {tile(31, 31, 70, 82, "#fcd34d")}
        {tile(112, 31, 37, 42, "#f5f5f4")}
        {tile(112, 84, 37, 65, "#fb7185")}
        {tile(31, 124, 70, 25, "#f5f5f4")}
      </div>
    ),
    size,
  );
}
