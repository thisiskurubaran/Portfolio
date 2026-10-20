// Interface copy. Kept here with the rest of the content so components hold no text.
export const ui = {
  gyro: {
    label: "Tilt steering",
    hint: "Steer the beam by tilting your phone",
    denied: "Motion access was not allowed",
  },
  panel: {
    close: "Close",
    role: "Role",
    stack: "Built with",
    links: "Links",
    kinds: {
      fishing: "Experiment",
      cargo: "Product",
      sailboat: "About",
      rowboat: "Contact",
    },
  },
  plain: {
    title: "Plain version",
    intro: "Everything from the lighthouse as a simple page: projects, experiments, about and contact.",
    back: "Back to the lighthouse",
    privacy: "Privacy",
    sections: {
      cargo: "Products",
      fishing: "Experiments",
      sailboat: "About",
      rowboat: "Contact",
    },
    hidden: "Found at sea",
  },
  plainLink: {
    full: "Skip to plain site",
    short: "Plain site",
  },
  plainOffer: {
    noWebgl: "This browser cannot draw the 3D scene. The plain site has everything that is on the water.",
    slow: "This device seems to be working hard to draw the scene. The plain site has everything and loads fast.",
    open: "Open plain site",
    keep: "Keep the scene",
  },
  ships: {
    nav: "Ships on the water",
  },
  harbor: {
    night: "Night mode",
    hint: "Jump to night and use the lighthouse beam",
  },
  barometer: {
    button: "Weather",
    legend: "Choose the weather",
    live: "Live weather",
    liveFallback: "Clear night (no local weather)",
    resets: "Only on this page. It resets when you reload.",
    presets: {
      clear: "Clear",
      fog: "Fog",
      rain: "Rain",
      storm: "Storm",
      "tropical-storm": "Tropical storm",
      major: { hurricane: "Hurricane", typhoon: "Typhoon", cyclone: "Cyclone" },
      "monsoon-squall": "Monsoon squall",
      noreaster: "Nor'easter",
    },
    wind: "km/h wind",
  },
  storm: {
    calmNote: "There is rough weather near you right now, so the sea here is kept calm. Stay safe.",
  },
  // WMO weather codes in words, for the live weather line.
  weatherWords: {
    clear: "clear",
    cloudy: "cloudy",
    fog: "fog",
    drizzle: "drizzle",
    rain: "rain",
    snow: "snow",
    showers: "showers",
    thunder: "thunderstorm",
  },
  rescue: {
    distress: "Boat in distress",
    hint: "Hold the beam on it",
    guiding: "Guiding it home",
    progress: "Rescue progress",
  },
};
