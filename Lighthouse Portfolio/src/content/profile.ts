import type { VesselEntry } from "./types";

export const profile = {
  name: "Kurubaran Anandhan",
  role: "Developer",
  github: "https://github.com/thisiskurubaran",
};

// The sailboat carries the about section.
export const about: VesselEntry = {
  id: "about",
  kind: "sailboat",
  title: `About ${profile.name}`,
  tag: "The keeper",
  summary: "A short paragraph about you, what you work on and what you are looking for. Edit it in src/content/profile.ts.",
  role: profile.role,
  links: [{ label: "GitHub", href: profile.github }],
  media: [],
};

// The rowboat tied to the jetty is the way to get in touch.
export const contact: VesselEntry = {
  id: "contact",
  kind: "rowboat",
  title: "Get in touch",
  tag: "Contact",
  summary: "The best way to reach you, and what kind of messages you are happy to get.",
  links: [{ label: "GitHub", href: profile.github }],
  media: [],
};
