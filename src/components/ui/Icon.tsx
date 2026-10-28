const paths = {
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01",
  type: "M5 6V4h14v2M12 4v16M9 20h6",
  palette: "M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.2-1.6-.4-1 .2-2.4 1.6-2.4H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10zM7.5 11h.01M10 7.5h.01M14.5 7.5h.01",
  layout: "M4 4h16v16H4zM4 11h16M11 11v9",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  gift: "M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1.5-3-5-3.5-5-1s3.5 1 5 1zM12 7c1.5-3 5-3.5 5-1s-3.5 1-5 1z",
  undo: "M9 5 4 10l5 5M4 10h10a5 5 0 0 1 0 10h-3",
  redo: "m15 5 5 5-5 5M20 10H10a5 5 0 0 0 0 10h3",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  left: "m15 6-6 6 6 6",
  right: "m9 6 6 6-6 6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  check: "m5 12 5 5 9-10",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  upload: "M12 16V5M7 10l5-5 5 5M5 20h14",
  swap: "M7 7h13M16 3l4 4-4 4M17 17H4M8 13l-4 4 4 4",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  home: "M4 11 12 4l8 7v9h-5v-6H9v6H4z",
  menu: "M4 7h16M4 12h16M4 17h16",
  music: "M9 18V6l11-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  plane: "M3 13l18-8-6 16-3-7-9-1z",
  cake: "M4 21h16v-8H4zM4 16c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1 4 0M12 13V9M12 6.5a1.5 1.5 0 0 0 1.5-1.5C13.5 4 12 3 12 3s-1.5 1-1.5 2A1.5 1.5 0 0 0 12 6.5z",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3",
  family: "M7 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3 21v-6a4 4 0 0 1 8 0M13 15a4 4 0 0 1 8 0v6M9 21v-2a3 3 0 0 1 6 0v2",
  heart: "M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11z",
  rings: "M9 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM15 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  leaf: "M5 19C5 10 11 4 20 4c0 9-6 15-15 15zM5 19l7-7",
  alert: "M12 4 2.5 20h19zM12 10v4M12 17h.01",
  sort: "M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3M12 17h.01",
  shield: "M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7",
  sliders: "M4 7h9M17 7h3M15 5v4M4 17h3M11 17h9M9 15v4",
  down: "m6 9 6 6 6-6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  printer: "M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7z",
} as const;

export type IconName = keyof typeof paths;

/** Линейная иконка 24×24; цвет наследуется от текста. */
export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
