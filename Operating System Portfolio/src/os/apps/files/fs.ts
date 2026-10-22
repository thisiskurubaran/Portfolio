import { certifications, contact, experience, profile, projects, skills } from "@/content";
import { notes } from "@/content/notes";
import type { IconName } from "@/design/icons";
import type { AppId } from "@/os/apps/registry";
import { slug } from "@/os/system/search";

// The portfolio as a file system. Every file is built from src/content, so
// Files never shows anything the apps do not.
export interface FileEntry {
  name: string;
  kind: string;
  icon: IconName;
  tile: string;
  preview: string;
  open: { app: AppId; anchor?: string } | { href: string };
  modified?: string;
}

export interface Folder {
  id: string;
  name: string;
  icon: IconName;
  files: FileEntry[];
}

const roleFile = (r: (typeof experience)[number]): FileEntry => ({
  name: `${r.company} - ${r.title.split(" (")[0]}.txt`,
  kind: "Role",
  icon: "experience",
  tile: "experience",
  preview: [r.title, `${r.company} · ${r.type}`, `${r.start} to ${r.end} · ${r.location}`, "", r.summary || "No summary on record.", "", `Skills: ${r.skills.join(", ")}`].join("\n"),
  open: { app: "experience", anchor: `role-${r.id}` },
  modified: r.start,
});

export const folders: Folder[] = [
  {
    id: "documents",
    name: "Documents",
    icon: "files",
    files: [
      {
        name: "Resume.pdf",
        kind: "PDF document",
        icon: "resume",
        tile: "resume",
        preview: "The full resume. Opens in the Resume viewer, with a download button.",
        open: { app: "resume" },
      },
      {
        name: "About me.txt",
        kind: "Text",
        icon: "about",
        tile: "about",
        preview: [profile.name, profile.status, "", profile.bio].join("\n"),
        open: { app: "about" },
      },
      {
        name: "skills.json",
        kind: "JSON",
        icon: "skills",
        tile: "skills",
        preview: JSON.stringify(skills, null, 2),
        open: { app: "skills" },
      },
    ],
  },
  {
    id: "experience",
    name: "Experience",
    icon: "experience",
    files: experience.map(roleFile),
  },
  {
    id: "projects",
    name: "Projects",
    icon: "projects",
    files: projects.map((p) => ({
      name: p.name,
      kind: "Project",
      icon: "projects",
      tile: "projects",
      preview: [p.name, "", p.description, "", `Built with ${p.tech.join(", ")}`].join("\n"),
      open: { app: "projects", anchor: `project-${p.id}` },
    })),
  },
  {
    id: "certificates",
    name: "Certificates",
    icon: "certifications",
    files: certifications.map((c) => ({
      name: `${c.name}.cert`,
      kind: "Certificate",
      icon: "certifications",
      tile: "certifications",
      preview: [c.name, `${c.issuer}, ${c.date}`, c.verified ? "Verified" : "", c.credentialId ? `Credential ${c.credentialId}` : ""].filter(Boolean).join("\n"),
      open: { app: "certifications", anchor: `cert-${slug(c.name)}` },
      modified: c.date,
    })),
  },
  {
    id: "notes",
    name: "Notes",
    icon: "notes",
    files: notes.map((n) => ({ name: `${n.title}.md`, kind: "Note", icon: "notes", tile: "notes", preview: n.summary, open: { app: "notes" }, modified: n.date })),
  },
  {
    id: "links",
    name: "Links",
    icon: "browser",
    files: contact.links.map((l) => ({ name: `${l.label}.url`, kind: "Link", icon: "browser", tile: "browser", preview: l.url, open: { href: l.url } })),
  },
];
