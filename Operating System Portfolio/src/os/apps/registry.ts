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
  { id: "experience", name: "Experience", icon: "experience", load: () => import("./content/Experience") },
  { id: "projects", name: "Projects", icon: "projects", load: () => import("./content/Projects") },
  { id: "skills", name: "Skills", icon: "skills", load: () => import("./content/Skills") },
  { id: "certifications", name: "Certifications", icon: "certifications", load: () => import("./content/Certifications") },
  { id: "contact", name: "Mail", icon: "contact", load: () => import("./content/Mail") },
  { id: "resume", name: "Resume", icon: "resume", load: () => import("./content/Resume") },
  { id: "terminal", name: "Terminal", icon: "terminal", load: () => import("./content/Terminal") },
  { id: "settings", name: "Settings", icon: "settings", load: () => import("./content/Settings") },
  { id: "photos", name: "Photos", icon: "photos", load: () => import("./content/Photos") },
  { id: "browser", name: "Browser", icon: "browser", load: () => import("./content/Browser") },
  { id: "notes", name: "Notes", icon: "notes", load: () => import("./content/Notes") },
];

export const launchable = apps.filter((app) => app.load);

export const getApp = (id: AppId) => apps.find((app) => app.id === id);

// Lazy components are created once at module load. Creating them during
// render would remount the app on every state change.
export const appComponents: Partial<Record<AppId, ComponentType>> = Object.fromEntries(
  launchable.map((app) => [app.id, lazy(app.load!)]),
);
