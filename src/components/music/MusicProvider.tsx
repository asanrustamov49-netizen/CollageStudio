"use client";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createAmbientMusic,
  TRACKS,
  type AmbientMusic,
  type TrackId,
} from "./ambientMusic";

interface MusicApi {
  playing: boolean;
  disabled: boolean;
  track: (typeof TRACKS)[number];
  volume: number;
  error: string | null;
  toggle: () => Promise<void>;
  selectTrack: (id: TrackId) => Promise<void>;
  playTrack: (id: TrackId) => Promise<void>;
  setVolume: (volume: number) => void;
}

const MusicContext = createContext<MusicApi | null>(null);
const DisableContext = createContext<(disabled: boolean) => void>(() => {});

export function MusicProvider({ children }: { children: ReactNode }) {
  const musicRef = useRef<AmbientMusic | null>(null);
  const [playing, setPlaying] = useState(false);
  const [trackId, setTrackId] = useState<TrackId>("dawn");
  const [volume, setVolumeState] = useState(0.5);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);

  if (disabled && playing) setPlaying(false);

  useEffect(() => {
    if (disabled) musicRef.current?.stop();
  }, [disabled]);

  useEffect(() => () => musicRef.current?.stop(), []);

  async function play(id: TrackId) {
    musicRef.current?.stop();
    musicRef.current = createAmbientMusic(volume, id);
    try {
      await musicRef.current.start();
      setPlaying(true);
    } catch (e) {
      setPlaying(false);
      setError(e instanceof Error ? e.message : "Не удалось включить музыку.");
    }
  }

  const api: MusicApi = {
    playing,
    disabled,
    track: TRACKS.find((t) => t.id === trackId) ?? TRACKS[0],
    volume,
    error,
    async toggle() {
      setError(null);
      if (playing) {
        musicRef.current?.stop();
        setPlaying(false);
      } else {
        await play(trackId);
      }
    },
    async selectTrack(id) {
      setError(null);
      setTrackId(id);
      if (playing) await play(id);
    },
    async playTrack(id) {
      setError(null);
      setTrackId(id);
      await play(id);
    },
    setVolume(next) {
      setVolumeState(next);
      musicRef.current?.setVolume(next);
    },
  };

  return (
    <MusicContext value={api}>
      <DisableContext value={setDisabled}>{children}</DisableContext>
    </MusicContext>
  );
}

export function MusicRouteGuard() {
  const pathname = usePathname();
  const setDisabled = useContext(DisableContext);
  useEffect(() => {
    setDisabled(pathname.startsWith("/projects/"));
  }, [pathname, setDisabled]);
  return null;
}

export function useMusic(): MusicApi {
  const api = useContext(MusicContext);
  if (!api)
    throw new Error("useMusic должен использоваться внутри MusicProvider.");
  return api;
}

export function Equalizer({
  playing,
  bars = 5,
  className = "",
}: {
  playing: boolean;
  bars?: number;
  className?: string;
}) {
  return (
    <span aria-hidden className={`flex h-4 items-end gap-0.5 ${className}`}>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={`h-full w-[3px] origin-bottom rounded-full bg-current ${playing ? "animate-eq" : "scale-y-[0.2]"}`}
          style={{
            animationDelay: `${-i * 170}ms`,
            animationDuration: `${700 + (i % 3) * 180}ms`,
          }}
        />
      ))}
    </span>
  );
}
