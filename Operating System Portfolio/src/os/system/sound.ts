"use client";

import { usePreferences } from "@/os/state/preferences";

// F30: soft synthesised UI sounds. Nothing plays unless Sound is on, and the
// audio context is only created on first use, after a click.
let ctx: AudioContext | null = null;

type Cue = "open" | "close" | "notify" | "alarm";

const cues: Record<Cue, { freqs: number[]; step: number; length: number; gain: number }> = {
  open: { freqs: [660, 880], step: 0.06, length: 0.12, gain: 0.04 },
  close: { freqs: [740, 520], step: 0.05, length: 0.1, gain: 0.035 },
  notify: { freqs: [880, 1175], step: 0.09, length: 0.22, gain: 0.05 },
  alarm: { freqs: [988, 784, 988, 784, 988], step: 0.18, length: 0.16, gain: 0.08 },
};

export function play(cue: Cue) {
  const { sound, volume } = usePreferences.getState();
  if (!sound || volume <= 0) return;
  try {
    ctx ??= new AudioContext();
    const { freqs, step, length, gain } = cues[cue];
    const t0 = ctx.currentTime;
    freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator();
      const g = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const start = t0 + i * step;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(gain * volume, start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, start + length);
      osc.connect(g).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + length + 0.02);
    });
  } catch {
    // No audio support: sounds are a nicety, never required.
  }
}
