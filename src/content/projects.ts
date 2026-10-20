import type { Entry } from "./types";

// Fishing boats are small experiments, cargo ships are bigger products.
// Placeholder entries: replace with real projects. Media files go in public/media/.
export const projects: Entry[] = [
  {
    id: "project-one",
    kind: "cargo",
    title: "Project One",
    tag: "Large product placeholder",
    summary:
      "One paragraph on what this product does, who uses it and what you built. Replace this entry in src/content/projects.ts.",
    role: "Lead developer",
    stack: ["Next.js", "TypeScript", "PostgreSQL"],
    links: [{ label: "Source", href: "https://github.com/thisiskurubaran" }],
    media: [],
  },
  {
    id: "project-two",
    kind: "cargo",
    title: "Project Two",
    tag: "Another big one",
    summary: "One paragraph on the problem, your part in it and the result.",
    role: "Full stack developer",
    stack: ["React", "Node.js"],
    links: [],
    media: [],
  },
  {
    id: "experiment-one",
    kind: "fishing",
    title: "Experiment One",
    tag: "Weekend experiment",
    summary: "A short note on a small thing you built to learn something.",
    stack: ["three.js", "GLSL"],
    links: [],
    media: [],
  },
  {
    id: "experiment-two",
    kind: "fishing",
    title: "Experiment Two",
    tag: "Small tool",
    summary: "A short note on a small tool and why it exists.",
    stack: ["Rust"],
    links: [],
    media: [],
  },
  {
    id: "experiment-three",
    kind: "fishing",
    title: "Experiment Three",
    tag: "Prototype",
    summary: "A short note on a prototype and what it taught you.",
    stack: ["Python"],
    links: [],
    media: [],
  },
];
