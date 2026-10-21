/**
 * Mission control's side of the guided flight: one objective at a time.
 * "say" is the radio call, "do" the short objective line, "act" the
 * prompt shown when the astronaut is close enough to do it.
 */
export const guide = {
  capcom: "CAPCOM",
  objective: "Objective",
  autopilot: "Autopilot",
  autopilotNote: "Does this step for you: for keyboard, touch or a quick look.",
  distance: (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`),
  press: "E",
  controls: {
    walk: "W A S D to walk, Shift to jog, Space to jump, E to use. Drag to look around.",
    eva: "W A S D to fly, Space and Shift up and down, X to stop drifting, E to use. Drag to look around.",
    drive: "W A S D to drive, Space to brake, E to climb out.",
  },
  climbOut: "Climb out of the rover",
  openHere: "Open what is here",
  jetpack: "JETPACK",
  tether: "TETHER",
  steps: {
    board: {
      say: "Good morning, Commander. Before you suit up for good, the mission board by the pad has your brief.",
      do: "Walk to the mission board",
      act: "Read the mission brief",
    },
    lift: {
      say: "Brief received. Take the lift up the service tower; the crew access arm leads to the hatch.",
      do: "Take the tower lift to the capsule",
      act: "Ride the lift and board",
    },
    boarding: { say: "Hatch closing. Strap in.", do: "Boarding", act: "" },
    ascent: {
      say: "You are go for launch. Sit back; the climb to orbit is on us. Skip it any time.",
      do: "Ride the ascent",
      act: "",
    },
    pods: {
      say: "Good orbit. Step outside: the instrument pods ahead of the ship hold its systems, one per skill group.",
      do: "Fly to an instrument pod",
      act: "Read this pod",
    },
    hatch: {
      say: "Seen enough? Come back to the hatch and we will plan the transfer to Mars.",
      do: "Return to the hatch",
      act: "Go back inside",
    },
    depart: {
      say: "Transfer plan is on your panel. Fire the departure burn when you are ready.",
      do: "Fire the departure burn",
      act: "",
    },
    cruise: {
      say: "On the transfer. We will wake you at the next station.",
      do: "Cruise to the next station",
      act: "",
    },
    station: {
      say: "Holding off the station. Suit up and fly across to its docking port.",
      do: "Fly to the docking port",
      act: "Dock here",
    },
    docked: { say: "Docked. Take your time.", do: "Look around, then undock", act: "" },
    arrived: { say: "Mars is ahead. Begin the approach when ready.", do: "Begin the Mars approach", act: "" },
    capture: { say: "Aerocapture in progress. Hold on.", do: "Ride the capture", act: "" },
    site: {
      say: "Welcome to Mars orbit. Pick a landing site and take her down.",
      do: "Pick a landing site and begin descent",
      act: "",
    },
    descent: { say: "Seven minutes of terror, compressed. Hold on.", do: "Ride the descent", act: "" },
    rover: {
      say: "Touchdown. Step down and walk to the rover; it will take you to the beacons.",
      do: "Walk to the rover",
      act: "Climb into the rover",
    },
    explore: {
      say: "Beacons on the ground hold the deep dives, and the base by the lander has the contact links. On foot or by rover.",
      do: "Visit a beacon or the base",
      act: "",
    },
  },
} as const;

export type StepId = keyof typeof guide.steps;
