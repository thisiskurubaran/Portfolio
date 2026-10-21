import type { Phase } from "@/state/store";

/**
 * Mission control's side of the radio. Each line is sent from Earth when
 * the ground sees the event, so it reaches the crew a full round trip of
 * light time later: seconds near Earth, half an hour at Mars. These are
 * text transmissions; there are no recorded voices.
 */
export const commsLines: Partial<Record<Phase, string>> = {
  ascent: "Liftoff. Clear of the tower, all stages nominal.",
  orbit: "Good orbit. Arrays deployed and power positive. Transfer planning is yours when you are ready.",
  transit: "Burn confirmed. You are on the transfer to Mars. Next contact as you pass the first station.",
  capture: "We have you inbound to Mars. Aerocapture corridor looks good from here.",
  marsOrbit: "Capture confirmed. Welcome to Mars orbit.",
  descent: "Go for deorbit. By the time this reaches you, you will already be down. Good luck.",
  surface: "Touchdown confirmed. Welcome to Mars. The base is close to your lander.",
};

export const commsUi = {
  from: "Mission control",
  label: "Messages from mission control",
  inFlight: (s: string) => `Message from Earth in flight, arriving in ${s}`,
  roundTrip: (s: string) => `Sent after a round trip of ${s} of light time.`,
} as const;
