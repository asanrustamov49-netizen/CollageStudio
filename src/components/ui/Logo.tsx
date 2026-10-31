export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className={`shrink-0 ${className}`}>
      <rect
        width="64"
        height="64"
        rx="16"
        fill="#1c1917"
        stroke="#44403c"
        strokeWidth="2"
      />
      <rect x="11" y="11" width="25" height="29" rx="5" fill="#fcd34d" />
      <rect x="40" y="11" width="13" height="15" rx="4" fill="#f5f5f4" />
      <rect x="40" y="30" width="13" height="23" rx="4" fill="#fb7185" />
      <rect x="11" y="44" width="25" height="9" rx="4" fill="#f5f5f4" />
    </svg>
  );
}

export function Logo({
  className = "",
  markClassName = "size-8",
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      <span className="font-display text-xl leading-none whitespace-nowrap text-stone-100 italic sm:text-2xl">
        Collage <span className="text-amber-300 not-italic">Studio</span>
      </span>
    </span>
  );
}
