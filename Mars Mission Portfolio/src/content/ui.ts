export const ui = {
  siteTitle: "Mars Mission",
  siteDescription:
    "Kurubaran Anandhan's developer portfolio, flown as a crewed mission from Earth to Mars.",
  srHeading: "Mars mission portfolio of Kurubaran Anandhan",
  clock: {
    label: "Mission clock",
    utc: "UTC",
    met: "MET",
    mars: "MARS",
    signal: "SIG",
    signalNote: "One way radio delay to Mars at light speed",
    scale: "Scale",
    scaleNote:
      "Earth and the Sun are drawn at their real relative sizes. The Sun is placed about 12 times closer than it really is so it fits in view, and shrunk to keep its real apparent size. Planets are points of light in their real directions. Positions use the real current time, or simulated time under warp.",
  },
  warp: {
    label: "Time warp",
    options: [
      { value: 1, label: "1x", description: "Real time" },
      { value: 3600, label: "1 h/s", description: "One hour per second" },
      { value: 86_400, label: "1 d/s", description: "One day per second" },
      { value: 2_592_000, label: "30 d/s", description: "Thirty days per second" },
    ],
    reset: "Now",
    resetDescription: "Back to real time and the current date",
  },
  bodies: {
    listLabel: "Planets in view",
    distance: "Distance",
    lightTime: "Light time",
    radius: "Radius",
    year: "Year",
    day: "Day",
    close: "Close",
    tapHint: "Tap a planet in the sky, or pick one here.",
  },
} as const;
