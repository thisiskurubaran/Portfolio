/**
 * Stations along the transfer orbit, in the order the ship passes them.
 * Each opens one part of the portfolio when the ship docks. `at` is how far
 * along the cruise the station sits (0 at Earth departure, 1 at Mars).
 */
export type StationKind = "education" | "experience" | "certifications" | "project";

export type StationModel = {
  /** Pressurised modules along the main axis. */
  modules: number;
  /** Pairs of solar wings. */
  arrays: number;
  /** A rotating habitat ring. */
  ring?: boolean;
  /** Accent colour for the station's identification band. */
  accent: string;
};

export type Station = {
  id: string;
  name: string;
  kind: StationKind;
  /** For experience stations: the employer, matching `company` in experience.ts. */
  company?: string;
  /** For project stations: the id in projects.ts. */
  project?: string;
  at: number;
  model: StationModel;
};

export const stations: readonly Station[] = [
  {
    id: "education",
    name: "Sri Venkateswara College of Engineering",
    kind: "education",
    at: 0.03,
    model: { modules: 1, arrays: 1, accent: "#7fb2ff" },
  },
  {
    id: "santan",
    name: "Santan Infotech",
    kind: "experience",
    company: "Santan Infotech Pvt. Ltd.",
    at: 0.14,
    model: { modules: 4, arrays: 3, ring: true, accent: "#ffb36b" },
  },
  {
    id: "prodex",
    name: "ProdEx Technologies",
    kind: "experience",
    company: "ProdEx Technologies",
    at: 0.3,
    model: { modules: 3, arrays: 2, accent: "#7fe0c4" },
  },
  {
    id: "mots",
    name: "MOTS Software Solutions",
    kind: "experience",
    company: "MOTS Software Solutions",
    at: 0.45,
    model: { modules: 3, arrays: 2, accent: "#c49bff" },
  },
  {
    id: "early",
    name: "Early career outpost",
    kind: "experience",
    at: 0.58,
    model: { modules: 2, arrays: 1, accent: "#9aa6b8" },
  },
  {
    id: "certifications",
    name: "Certification satellite",
    kind: "certifications",
    at: 0.7,
    model: { modules: 1, arrays: 1, accent: "#ffd76b" },
  },
  {
    id: "instant-eats",
    name: "Instant Eats",
    kind: "project",
    project: "instant-eats",
    at: 0.84,
    model: { modules: 4, arrays: 2, ring: true, accent: "#ff7a6b" },
  },
];

/** Employers grouped into the early career outpost rather than a station each. */
export const EARLY_CAREER = ["Cavintek", "Freelance", "BigFday.com", "Jenesys Technologies", "Mocero Health Solutions"];
