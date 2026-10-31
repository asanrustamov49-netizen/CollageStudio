export type TrackId = "dawn" | "night" | "summer";

interface Track {
  id: TrackId;
  title: string;
  mood: string;
  chords: number[][];
  step: number;
  filter: number;
  pluckOctave: number;
  pluckGain: number;
}

export const TRACKS: Track[] = [
  {
    id: "dawn",
    title: "Рассвет",
    mood: "Спокойно и светло",
    chords: [
      [130.81, 164.81, 196.0, 246.94],
      [110.0, 130.81, 164.81, 196.0],
      [87.31, 110.0, 130.81, 164.81],
      [98.0, 123.47, 146.83, 164.81],
    ],
    step: 0.5,
    filter: 1800,
    pluckOctave: 4,
    pluckGain: 0.09,
  },
  {
    id: "night",
    title: "Ночь",
    mood: "Глубоко и медленно",
    chords: [
      [110.0, 130.81, 164.81, 196.0],
      [87.31, 110.0, 130.81, 164.81],
      [73.42, 87.31, 110.0, 130.81],
      [82.41, 98.0, 123.47, 146.83],
    ],
    step: 0.75,
    filter: 1100,
    pluckOctave: 2,
    pluckGain: 0.12,
  },
  {
    id: "summer",
    title: "Лето",
    mood: "Ярко и легко",
    chords: [
      [146.83, 185.0, 220.0, 293.66],
      [123.47, 146.83, 185.0, 220.0],
      [98.0, 123.47, 146.83, 196.0],
      [110.0, 138.59, 164.81, 220.0],
    ],
    step: 0.375,
    filter: 2600,
    pluckOctave: 4,
    pluckGain: 0.08,
  },
];
const LOOKAHEAD_SECONDS = 1;

export interface AmbientMusic {
  start(): Promise<void>;
  stop(): void;
  setVolume(volume: number): void;
}

export function createAmbientMusic(
  initialVolume: number,
  trackId: TrackId = "dawn",
): AmbientMusic {
  const track = TRACKS.find((t) => t.id === trackId) ?? TRACKS[0];
  const chordSeconds = track.step * 8;
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let bus: AudioNode | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let nextStep = 0;
  let step = 0;
  let volume = initialVolume;

  function setup(audio: AudioContext) {
    master = audio.createGain();
    master.gain.value = 0;
    master.connect(audio.destination);

    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = track.filter;
    filter.connect(master);

    const delay = audio.createDelay();
    delay.delayTime.value = 0.38;
    const feedback = audio.createGain();
    feedback.gain.value = 0.32;
    delay.connect(feedback).connect(delay);
    delay.connect(filter);

    const input = audio.createGain();
    input.connect(filter);
    input.connect(delay);
    bus = input;
  }

  function note(
    freq: number,
    time: number,
    length: number,
    gain: number,
    type: OscillatorType,
  ) {
    if (!ctx || !bus) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(gain, time + Math.min(1.2, length / 3));
    env.gain.exponentialRampToValueAtTime(0.0001, time + length);
    osc.connect(env).connect(bus);
    osc.start(time);
    osc.stop(time + length + 0.05);
  }

  function pluck(freq: number, time: number) {
    if (!ctx || !bus) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(track.pluckGain, time + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 1.4);
    osc.connect(env).connect(bus);
    osc.start(time);
    osc.stop(time + 1.5);
  }

  function schedule() {
    if (!ctx) return;
    while (nextStep < ctx.currentTime + LOOKAHEAD_SECONDS) {
      const chord = track.chords[Math.floor(step / 8) % track.chords.length];
      const inChord = step % 8;
      if (inChord === 0) {
        for (const freq of chord) {
          note(freq, nextStep, chordSeconds + 1, 0.05, "triangle");
          note(freq * 2.003, nextStep, chordSeconds + 1, 0.015, "sine");
        }
      }
      const pattern = [0, 2, 1, 3, 2, 1, 3, 0];
      if (inChord !== 7)
        pluck(chord[pattern[inChord]] * track.pluckOctave, nextStep);
      nextStep += track.step;
      step++;
    }
  }

  function applyVolume(rampSeconds: number) {
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(volume, ctx.currentTime, rampSeconds);
  }

  const music: AmbientMusic = {
    async start() {
      if (ctx) return;
      const AudioCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtor) throw new Error("Браузер не поддерживает Web Audio.");
      const audio = new AudioCtor();
      ctx = audio;
      setup(audio);
      await Promise.race([
        audio.resume(),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
      if (ctx !== audio) return; // Выключили, пока шёл запуск.
      if (audio.state !== "running") {
        music.stop();
        throw new Error("Браузер заблокировал звук. Нажмите кнопку ещё раз.");
      }
      step = 0;
      nextStep = audio.currentTime + 0.1;
      timer = setInterval(schedule, 250);
      schedule();
      applyVolume(0.6);
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      const audio = ctx;
      const gain = master;
      ctx = null;
      master = null;
      bus = null;
      if (!audio) return;
      gain?.gain.cancelScheduledValues(audio.currentTime);
      gain?.gain.setTargetAtTime(0, audio.currentTime, 0.1);
      setTimeout(() => void audio.close().catch(() => {}), 500);
    },
    setVolume(next) {
      volume = next;
      if (timer) applyVolume(0.1);
    },
  };
  return music;
}
