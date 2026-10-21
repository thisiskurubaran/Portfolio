export type Project = {
  id: string;
  name: string;
  summary: string;
  parts?: readonly string[];
  tech: readonly string[];
  /** Omitted when there is no public link. */
  url?: string;
};

export const projects: readonly Project[] = [
  {
    id: "instant-eats",
    name: "Instant Eats",
    summary:
      "A food ordering and delivery platform of four connected apps, with real-time sync, push notifications and role-specific experiences.",
    parts: ["Admin panel", "Customer app", "Delivery partner", "Restaurant management"],
    tech: ["Flutter", "React", "Node.js", "MongoDB", "Firebase", "Real-time"],
  },
];
