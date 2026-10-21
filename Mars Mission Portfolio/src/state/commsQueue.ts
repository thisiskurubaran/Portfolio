import type { Vec3 } from "@/physics/vec";

export type CommsMessage = {
  id: number;
  text: string;
  /** Simulated time the crew's event happened, ms. */
  eventMs: number;
  /** Simulated time the reply reaches the crew, ms. */
  arriveMs: number;
};

/**
 * Light time there and back: Earth sees the event one way later and its
 * reply takes the same again. The distance is taken at the event; the
 * ship moves too little in that time to matter for a message.
 */
export function roundTripMs(earthAu: Vec3, crewAu: Vec3 | null, lightSecondsPerAu: number): number {
  if (!crewAu) return 0;
  const d = Math.hypot(crewAu[0] - earthAu[0], crewAu[1] - earthAu[1], crewAu[2] - earthAu[2]);
  return 2 * d * lightSecondsPerAu * 1000;
}

let nextId = 1;
export const comms: { messages: CommsMessage[] } = { messages: [] };

export function sendFromEarth(text: string, eventMs: number, delayMs: number): CommsMessage {
  const m = { id: nextId++, text, eventMs, arriveMs: eventMs + delayMs };
  comms.messages.push(m);
  return m;
}
