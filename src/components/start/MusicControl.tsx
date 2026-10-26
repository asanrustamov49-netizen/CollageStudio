"use client";

import { Equalizer, useMusic } from "@/components/music/MusicProvider";

/** Плавающая кнопка фоновой музыки на начальном экране. По умолчанию звук выключен. */
export function MusicControl() {
  const { playing, track, volume, error, toggle, setVolume } = useMusic();

  return (
    <div className="flex items-center gap-3 rounded-full border border-stone-700 bg-stone-900/90 py-1.5 pr-4 pl-1.5 shadow-lg shadow-black/40 backdrop-blur">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        className="flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1.5 text-xs font-semibold text-stone-950 hover:bg-amber-200"
      >
        <Equalizer playing={playing} bars={3} className="h-3" />
        {playing ? `«${track.title}» — выключить` : "Включить музыку"}
      </button>
      <label className="flex items-center gap-2 text-xs text-stone-400">
        <span className="sr-only sm:not-sr-only">Громкость</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-20 accent-amber-300 sm:w-24"
        />
      </label>
      {error && (
        <span role="alert" className="text-xs text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
