export interface Project {
  id: string;
  name: string;
  description: string;
  tech: string[];
  url?: string;
}

export const projects: Project[] = [
  {
    id: "instant-eats",
    name: "Instant Eats",
    description:
      "A food ordering and delivery platform of four connected apps (admin panel, customer app, delivery partner, restaurant management), with real-time sync, push notifications and role-specific experiences.",
    tech: ["Flutter", "React", "Node.js", "MongoDB", "Firebase", "Real-time"],
  },
];
