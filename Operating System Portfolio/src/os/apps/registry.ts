import { lazy, type ComponentType } from "react";
import type { IconName } from "@/design/icons";

export type AppId =
  | "about" | "experience" | "projects" | "skills" | "certifications" | "contact"
  | "resume" | "terminal" | "settings" | "photos" | "browser" | "notes";

export interface AppDefinition {
  id: AppId;
  name: string;
  icon: IconName;
  // Headless content component, loaded when the app opens. Shells frame it.
  load?: () => Promise<{ default: ComponentType }>;
}

export const apps: AppDefinition[] = [
  { id: "about", name: "About", icon: "about", load: () => import("./content/About") },
  { id: "experience", name: "Experience", icon: "experience" },
  { id: "projects", name: "Projects", icon: "projects" },
  { id: "skills", name: "Skills", icon: "skills" },
  { id: "certifications", name: "Certifications", icon: "certifications" },
  { id: "contact", name: "Mail", icon: "contact" },
  { id: "resume", name: "Resume", icon: "resume" },
  { id: "terminal", name: "Terminal", icon: "terminal" },
  { id: "settings", name: "Settings", icon: "settings" },
  { id: "photos", name: "Photos", icon: "photos" },
  { id: "browser", name: "Browser", icon: "browser" },
  { id: "notes", name: "Notes", icon: "notes" },
];

// Apps without a component yet (terminal, settings) stay out of the dock.
export const launchable = apps.filter((app) => app.load);

export const getApp = (id: AppId) => apps.find((app) => app.id === id);

// Lazy components are created once at module load. Creating them during
// render would remount the app on every state change.
export const appComponents: Partial<Record<AppId, ComponentType>> = Object.fromEntries(
  launchable.map((app) => [app.id, lazy(app.load!)]),
);
