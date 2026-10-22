import { certifications, contact, education, experience, projects, skills } from "@/content";
import { launchable, type AppId } from "@/os/apps/registry";
import type { IconName } from "@/design/icons";
import { evaluate, formatNumber } from "./calc";

export interface SearchItem {
  id: string;
  label: string;
  detail: string;
  icon: IconName;
  appId?: AppId;
  anchor?: string;
  href?: string;
  // A value to copy instead of opening anything (spotlight maths).
  copy?: string;
  // Extra words that should match but are not shown.
  keywords?: string;
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Built once from the content modules, so search always matches what the apps show.
export const searchIndex: SearchItem[] = [
  ...launchable.map((app) => ({ id: `app-${app.id}`, label: app.name, detail: "App", icon: app.icon, appId: app.id })),
  { id: "app-resume-alias", label: "Resume", detail: "Download the CV", icon: "resume" as const, appId: "resume" as const, keywords: "cv hire" },
  ...experience.map((r) => ({
    id: `role-${r.id}`,
    label: r.title.split(" (")[0]!,
    detail: `${r.company}, ${r.start} to ${r.end}`,
    icon: "experience" as const,
    appId: "experience" as const,
    anchor: `role-${r.id}`,
    keywords: `${r.company} ${r.skills.join(" ")} ${r.location}`,
  })),
  ...projects.map((p) => ({
    id: `project-${p.id}`,
    label: p.name,
    detail: "Project",
    icon: "projects" as const,
    appId: "projects" as const,
    anchor: `project-${p.id}`,
    keywords: p.tech.join(" "),
  })),
  ...Object.entries(skills).flatMap(([category, items]) => [
    {
      id: `skills-${slug(category)}`,
      label: category,
      detail: "Skills",
      icon: "skills" as const,
      appId: "skills" as const,
      anchor: `skills-${slug(category)}`,
      keywords: items.join(" "),
    },
    ...items.map((item) => ({
      id: `skill-${slug(category)}-${slug(item)}`,
      label: item,
      detail: `Skill, ${category}`,
      icon: "skills" as const,
      appId: "skills" as const,
      anchor: `skills-${slug(category)}`,
    })),
  ]),
  ...certifications.map((c) => ({
    id: `cert-${slug(c.name)}`,
    label: c.name,
    detail: `${c.issuer}, ${c.date}`,
    icon: "certifications" as const,
    appId: "certifications" as const,
    anchor: `cert-${slug(c.name)}`,
    keywords: c.tag,
  })),
  ...education.map((e) => ({
    id: `edu-${slug(e.school)}`,
    label: e.degree,
    detail: e.school,
    icon: "about" as const,
    appId: "about" as const,
    keywords: e.coursework.join(" "),
  })),
  ...contact.links.map((l) => ({ id: `link-${l.id}`, label: l.label, detail: "Opens in a new tab", icon: "browser" as const, href: l.url })),
];

// Subsequence match: every query letter must appear in order. Earlier and
// tighter matches score higher, and a match at a word start scores highest.
function score(text: string, query: string): number {
  const t = text.toLowerCase();
  const direct = t.indexOf(query);
  if (direct !== -1) return 100 - direct + (direct === 0 || t[direct - 1] === " " ? 50 : 0);
  let ti = 0;
  let gaps = 0;
  for (const ch of query) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return 0;
    gaps += found - ti;
    ti = found + 1;
  }
  return Math.max(1, 40 - gaps);
}

export function search(query: string, limit = 12): SearchItem[] {
  const q = query.trim().toLowerCase();
  // A sum gets its answer as the top result.
  const sum = /[\d)]\s*[-+*/x×÷^%]\s*[\d(.]|^(sqrt|sin|cos|tan|ln|log)\(/.test(q) ? evaluate(q.replace(/(\d)\s*x\s*(\d)/g, "$1*$2")) : null;
  if (sum !== null) {
    const value = formatNumber(sum);
    return [{ id: "calc", label: `= ${value}`, detail: "Press Enter to copy", icon: "calculator", appId: "calculator", copy: value }, ...search(query.replace(/[-+*/×÷^%()]/g, " "), limit - 1)];
  }
  if (!q) return searchIndex.filter((i) => i.id.startsWith("app-") && i.id !== "app-resume-alias");
  return searchIndex
    .map((item) => ({ item, s: Math.max(score(item.label, q) * 2, score(item.detail, q), item.keywords ? score(item.keywords, q) * 0.8 : 0) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.item);
}
