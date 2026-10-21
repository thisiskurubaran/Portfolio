import { type AudioGraph, buildGraph } from "./engine";

/**
 * Sound is off until the visitor turns it on. The graph is built on the
 * first opt-in, inside the click, and suspended (not torn down) when they
 * turn it off again.
 */
export const sound: { graph: AudioGraph | null; on: boolean } = { graph: null, on: false };

export async function setSound(on: boolean): Promise<void> {
  sound.on = on;
  if (on) {
    sound.graph ??= buildGraph();
    await sound.graph.ctx.resume();
  } else if (sound.graph) {
    await sound.graph.ctx.suspend();
  }
}

/** What is audible right now, for the captions. */
export const captions = new Set<string>();
