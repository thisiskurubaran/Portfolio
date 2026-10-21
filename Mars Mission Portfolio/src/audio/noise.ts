/**
 * Noise buffers for the synthesised sounds. Brown noise (integrated white)
 * carries the low rumble of engines and air; pink sits between the two and
 * suits fans and radio hiss.
 */
export type NoiseColour = "white" | "pink" | "brown";

export function fillNoise(out: Float32Array, colour: NoiseColour, random: () => number = Math.random): void {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let last = 0;
  for (let i = 0; i < out.length; i++) {
    const w = random() * 2 - 1;
    if (colour === "white") {
      out[i] = w;
    } else if (colour === "pink") {
      // Paul Kellet's economy filter: three poles, within 0.05 dB of -3 dB/octave above 10 Hz at 44.1 kHz.
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      out[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
    } else {
      // Leaky integrator, so the signal wanders but never drifts off.
      last = (last + 0.02 * w) / 1.02;
      out[i] = last * 3.5;
    }
  }
}

export function noiseBuffer(ctx: BaseAudioContext, colour: NoiseColour, seconds = 4): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  fillNoise(buffer.getChannelData(0), colour);
  return buffer;
}
