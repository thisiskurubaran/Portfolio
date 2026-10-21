import { noiseBuffer } from "./noise";

/**
 * The sound of the mission, all synthesised with the Web Audio API: no
 * recordings, so nothing to license. Built only after the visitor opts in
 * with a click, which also satisfies browser autoplay rules.
 *
 * Vacuum carries no sound. Outside the atmosphere everything the crew
 * hears comes through the hull, the suit or the radio: engine thrust as a
 * low structural rumble, the ship's fans and pumps, their own breathing.
 */

type Loop = { source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode };

export type AudioGraph = {
  ctx: AudioContext;
  master: GainNode;
  /** Engine noise carried by air: roar and crackle. Fades with altitude. */
  roar: Loop;
  crackle: Loop;
  /** Thrust felt through the structure, the part that survives vacuum. */
  hull: Loop;
  /** Life support fans. */
  fans: Loop;
  hum: { osc: OscillatorNode; gain: GainNode };
  /** Suit breathing on the surface, shaped breath by breath. */
  breath: Loop;
  radio: Loop;
  motor: { osc: OscillatorNode; filter: BiquadFilterNode; gain: GainNode; panner: PannerNode };
  ping: { panner: PannerNode };
  score: { oscs: OscillatorNode[]; gain: GainNode };
  noise: { white: AudioBuffer; pink: AudioBuffer; brown: AudioBuffer };
};

function loop(
  ctx: AudioContext,
  buffer: AudioBuffer,
  type: BiquadFilterType,
  freq: number,
  q: number,
  out: AudioNode,
): Loop {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  source.connect(filter).connect(gain).connect(out);
  source.start();
  return { source, gain, filter };
}

function panner(ctx: AudioContext): PannerNode {
  return new PannerNode(ctx, {
    panningModel: "HRTF",
    distanceModel: "inverse",
    refDistance: 6,
    maxDistance: 400,
    rolloffFactor: 1.4,
  });
}

export function buildGraph(): AudioGraph {
  const ctx = new AudioContext();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(comp).connect(ctx.destination);

  const noise = {
    white: noiseBuffer(ctx, "white", 2),
    pink: noiseBuffer(ctx, "pink", 4),
    brown: noiseBuffer(ctx, "brown", 6),
  };

  const hum = { osc: ctx.createOscillator(), gain: ctx.createGain() };
  // Mains-like hum from pumps and power conversion, low enough to sit under everything.
  hum.osc.frequency.value = 100;
  hum.gain.gain.value = 0;
  hum.osc.connect(hum.gain).connect(master);
  hum.osc.start();

  const motorPanner = panner(ctx);
  const motor = {
    osc: ctx.createOscillator(),
    filter: ctx.createBiquadFilter(),
    gain: ctx.createGain(),
    panner: motorPanner,
  };
  motor.osc.type = "sawtooth";
  motor.osc.frequency.value = 50;
  motor.filter.type = "lowpass";
  motor.filter.frequency.value = 300;
  motor.gain.gain.value = 0;
  motor.osc.connect(motor.filter).connect(motor.gain).connect(motorPanner).connect(master);
  motor.osc.start();

  const pingPanner = panner(ctx);
  pingPanner.connect(master);

  // A quiet open fifth with a drifting third voice for the cruise.
  const scoreGain = ctx.createGain();
  scoreGain.gain.value = 0;
  const scoreFilter = ctx.createBiquadFilter();
  scoreFilter.type = "lowpass";
  scoreFilter.frequency.value = 900;
  scoreGain.connect(scoreFilter).connect(master);
  const oscs = [110, 164.81, 220].map((f) => {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    o.connect(scoreGain);
    o.start();
    return o;
  });

  return {
    ctx,
    master,
    roar: loop(ctx, noise.brown, "lowpass", 140, 0.7, master),
    crackle: loop(ctx, noise.white, "highpass", 1800, 0.7, master),
    hull: loop(ctx, noise.brown, "lowpass", 55, 1.2, master),
    fans: loop(ctx, noise.pink, "bandpass", 420, 0.6, master),
    hum,
    breath: loop(ctx, noise.pink, "bandpass", 850, 1.1, master),
    radio: loop(ctx, noise.white, "bandpass", 1900, 0.8, master),
    motor,
    ping: { panner: pingPanner },
    score: { oscs, gain: scoreGain },
    noise,
  };
}

/** Eases a parameter toward a value; a short time constant avoids clicks. */
export function glide(param: AudioParam, value: number, ctx: BaseAudioContext, tau = 0.15): void {
  param.setTargetAtTime(value, ctx.currentTime, tau);
}

/** Quindar tones: the short beeps that keyed Apollo ground transmitters on (2525 Hz) and off (2475 Hz). */
export function quindar(g: AudioGraph, on: boolean, at = g.ctx.currentTime): void {
  const o = g.ctx.createOscillator();
  o.frequency.value = on ? 2525 : 2475;
  const gain = g.ctx.createGain();
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(0.08, at + 0.01);
  gain.gain.setValueAtTime(0.08, at + 0.24);
  gain.gain.linearRampToValueAtTime(0, at + 0.25);
  o.connect(gain).connect(g.master);
  o.start(at);
  o.stop(at + 0.26);
}

/** A radio transmission: tone on, a burst of carrier hiss, tone off. */
export function transmission(g: AudioGraph, seconds = 2.2): void {
  const t = g.ctx.currentTime;
  quindar(g, true, t);
  const p = g.radio.gain.gain;
  p.cancelScheduledValues(t);
  p.setValueAtTime(0, t + 0.25);
  p.linearRampToValueAtTime(0.05, t + 0.35);
  p.setValueAtTime(0.05, t + 0.25 + seconds);
  p.linearRampToValueAtTime(0, t + 0.35 + seconds);
  quindar(g, false, t + 0.4 + seconds);
}

/** A short click from a relay or valve somewhere in the ship. */
export function click(g: AudioGraph): void {
  const t = g.ctx.currentTime;
  const s = g.ctx.createBufferSource();
  s.buffer = g.noise.white;
  const f = g.ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 2500 + Math.random() * 2000;
  f.Q.value = 4;
  const gain = g.ctx.createGain();
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  s.connect(f).connect(gain).connect(g.master);
  s.start(t, Math.random());
  s.stop(t + 0.04);
}

/** One heartbeat, the lub-dub, felt in the suit under stress. */
export function heartbeat(g: AudioGraph): void {
  const t = g.ctx.currentTime;
  for (const [dt, level] of [
    [0, 0.35],
    [0.18, 0.22],
  ] as const) {
    const o = g.ctx.createOscillator();
    o.frequency.setValueAtTime(60, t + dt);
    o.frequency.exponentialRampToValueAtTime(35, t + dt + 0.12);
    const gain = g.ctx.createGain();
    gain.gain.setValueAtTime(0, t + dt);
    gain.gain.linearRampToValueAtTime(level, t + dt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.15);
    o.connect(gain).connect(g.master);
    o.start(t + dt);
    o.stop(t + dt + 0.16);
  }
}

/** One breath: a longer inhale, a pause, a softer exhale. */
export function breathe(g: AudioGraph, period: number, level: number): void {
  const t = g.ctx.currentTime;
  const p = g.breath.gain.gain;
  const inhale = period * 0.35;
  const exhale = period * 0.45;
  p.cancelScheduledValues(t);
  p.setValueAtTime(0, t);
  p.linearRampToValueAtTime(level, t + inhale * 0.6);
  p.linearRampToValueAtTime(0, t + inhale);
  p.linearRampToValueAtTime(level * 0.7, t + inhale + 0.15 + exhale * 0.3);
  p.linearRampToValueAtTime(0, t + inhale + 0.15 + exhale);
  // Inhale is brighter than exhale through a helmet.
  g.breath.filter.frequency.setValueAtTime(1100, t);
  g.breath.filter.frequency.setValueAtTime(700, t + inhale);
}

/** A soft locator ping from a surface beacon, placed in 3D. */
export function ping(g: AudioGraph): void {
  const t = g.ctx.currentTime;
  const o = g.ctx.createOscillator();
  o.frequency.value = 1320;
  const gain = g.ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.25, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  o.connect(gain).connect(g.ping.panner);
  o.start(t);
  o.stop(t + 0.62);
}
