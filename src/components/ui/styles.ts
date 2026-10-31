const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

export const ui = {
  accent: `${base} bg-amber-300 font-semibold text-stone-950 hover:bg-amber-200 focus-visible:outline-amber-400`,
  darkSecondary: `${base} border border-stone-700 text-stone-200 hover:bg-stone-800 focus-visible:outline-amber-300`,
  darkIcon:
    "inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-stone-700 text-stone-200 transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-35",
  primary: `${base} bg-stone-900 text-white hover:bg-stone-700 focus-visible:outline-stone-900`,
  secondary: `${base} border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 focus-visible:outline-stone-900`,
  danger: `${base} text-red-700 hover:bg-red-50 focus-visible:outline-red-600`,
  field:
    "mt-1 block min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none sm:text-sm",
  label: "text-sm font-medium text-stone-700",
};
