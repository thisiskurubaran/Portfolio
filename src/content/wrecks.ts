import type { Entry } from "./types";

/** F17: abandoned and failed projects, resting on the seabed. */
export type Wreck = Entry & {
  kind: "wreck";
  /** Which hull lies down there. */
  hull: "fishing" | "cargo";
  lessons: { wentWrong: string; learned: string };
};

// Placeholder wrecks: replace with real abandoned projects.
export const wrecks: Wreck[] = [
  {
    id: "wreck-one",
    kind: "wreck",
    hull: "cargo",
    title: "Sunk Project One",
    tag: "Abandoned",
    summary: "One line on what this project set out to do.",
    stack: ["Placeholder"],
    links: [],
    media: [],
    lessons: {
      wentWrong: "What went wrong, in a sentence or two. Replace in src/content/wrecks.ts.",
      learned: "What you took from it into the next project.",
    },
  },
  {
    id: "wreck-two",
    kind: "wreck",
    hull: "fishing",
    title: "Sunk Experiment Two",
    tag: "Never shipped",
    summary: "One line on the idea.",
    links: [],
    media: [],
    lessons: {
      wentWrong: "Why it stopped.",
      learned: "What you would do differently.",
    },
  },
  {
    id: "wreck-three",
    kind: "wreck",
    hull: "fishing",
    title: "Sunk Experiment Three",
    tag: "Ran aground",
    summary: "One line on the idea.",
    links: [],
    media: [],
    lessons: {
      wentWrong: "Why it stopped.",
      learned: "What you would do differently.",
    },
  },
];
