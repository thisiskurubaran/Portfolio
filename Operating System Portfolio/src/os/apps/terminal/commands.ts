import { certifications, contact, education, experience, profile, projects, skills } from "@/content";
import { apps, type AppId } from "@/os/apps/registry";
import { launch } from "@/os/system/launcher";
import { usePreferences, type ThemeMode } from "@/os/state/preferences";

export interface CommandContext {
  args: string[];
  history: string[];
  clear: () => void;
}

export interface Command {
  summary: string;
  hidden?: boolean;
  run: (ctx: CommandContext) => string[];
}

// Files in the home directory map to content, so `cat` always shows the real data.
const files: Record<string, () => string[]> = {
  "about.txt": () => [profile.name, profile.status, "", profile.bio, "", ...profile.stats.map((s) => `${s.label}: ${s.value}`)],
  "experience.txt": () =>
    experience.flatMap((r) => [`${r.start} to ${r.end}  ${r.title.split(" (")[0]}, ${r.company}`, ...(r.summary ? [`  ${r.summary}`] : []), ""]),
  "projects.txt": () => projects.flatMap((p) => [p.name, `  ${p.description}`, `  ${p.tech.join(", ")}`, ""]),
  "skills.json": () => JSON.stringify(skills, null, 2).split("\n"),
  "certifications.txt": () => certifications.map((c) => `${c.date}  ${c.name} (${c.issuer})${c.url ? `  ${c.url}` : ""}`),
  "education.txt": () => education.flatMap((e) => [`${e.degree}, ${e.school} (${e.start} to ${e.end})`, `  ${e.coursework.join(", ")}`]),
  "contact.txt": () => contact.links.map((l) => `${l.label.padEnd(10)} ${l.url}`),
};

const appIds = apps.filter((a) => !a.hidden).map((a) => a.id);

function resolveApp(name: string | undefined): AppId | null {
  if (!name) return null;
  const n = name.toLowerCase();
  const byId = apps.find((a) => a.id === n)?.id;
  if (byId) return byId;
  const byName = apps.find((a) => a.name.toLowerCase() === n);
  if (byName) return byName.id;
  if (n === "mail" || n === "contact") return "contact";
  return null;
}

export const commands: Record<string, Command> = {
  help: {
    summary: "list commands",
    run: () => [
      "Commands:",
      ...Object.entries(commands)
        .filter(([, c]) => !c.hidden)
        .map(([name, c]) => `  ${name.padEnd(10)} ${c.summary}`),
      "",
      "Try: open experience, cat skills.json, whoami",
    ],
  },
  whoami: {
    summary: "who runs this OS",
    run: () => [`${profile.name}`, profile.titles.join(" | "), profile.location],
  },
  ls: {
    summary: "list files",
    run: () => [Object.keys(files).join("  ")],
  },
  cat: {
    summary: "print a file, e.g. cat about.txt",
    run: ({ args }) => {
      const name = args[0];
      if (!name) return ["usage: cat <file>"];
      const key = files[name] ? name : Object.keys(files).find((f) => f.split(".")[0] === name);
      return key ? files[key]!() : [`cat: ${name}: no such file`];
    },
  },
  open: {
    summary: "open an app, e.g. open projects",
    run: ({ args }) => {
      const id = resolveApp(args[0]);
      if (!id) return [`open: unknown app "${args[0] ?? ""}". Apps: ${appIds.join(", ")}`];
      launch(id);
      return [`opening ${id}`];
    },
  },
  resume: {
    summary: "open the resume",
    run: () => {
      launch("resume");
      return ["opening resume"];
    },
  },
  theme: {
    summary: "set the theme: system, light, dark or auto",
    run: ({ args }) => {
      const mode = args[0] as ThemeMode | undefined;
      if (!mode || !["system", "light", "dark", "auto"].includes(mode)) return ["usage: theme system|light|dark|auto"];
      usePreferences.getState().setTheme(mode);
      return [`theme set to ${mode}`];
    },
  },
  date: {
    summary: "show the date and time",
    run: () => [new Date().toString()],
  },
  echo: {
    summary: "print text",
    run: ({ args }) => [args.join(" ")],
  },
  history: {
    summary: "show previous commands",
    run: ({ history }) => history.map((h, i) => `${String(i + 1).padStart(3)}  ${h}`),
  },
  // F29: easter eggs. Hidden from help, findable by the curious.
  sudo: {
    summary: "",
    hidden: true,
    run: () => ["guest is not in the sudoers file. This incident will be reported to nobody."],
  },
  rm: {
    summary: "",
    hidden: true,
    run: () => ["Nice try. folioOS is read-only for guests."],
  },
  exit: {
    summary: "",
    hidden: true,
    run: () => ["There is no exit. There is a plain view, though: /plain"],
  },
  coffee: {
    summary: "",
    hidden: true,
    run: () => ["    ( (", "     ) )", "  ........", "  |      |]", "  \\      /", "   `----'", "Brewing. Errors in this code are probably from before the coffee."],
  },
  neofetch: {
    summary: "",
    hidden: true,
    run: () => [
      "   _    _     guest@folioos",
      "  | |__| |__  ----------",
      "  | / /| '_ \\ OS: folioOS (browser)",
      "  |   < | |_) Shells: folioPhone, folioPad, folioDesk, folioVision",
      "  |_|\\_\\_.__/ Kernel: Next.js + React + Zustand",
      `               Owner: ${profile.name}`,
      `               Uptime: ${Math.round(performance.now() / 60000)} min`,
    ],
  },
  bowl: {
    summary: "",
    hidden: true,
    run: () => {
      launch("nets");
      return ["Run-up... released. Opening the nets."];
    },
  },
  clear: {
    summary: "clear the screen",
    run: ({ clear }) => {
      clear();
      return [];
    },
  },
};

export function runCommand(input: string, ctx: Omit<CommandContext, "args">): string[] {
  const [name, ...args] = input.trim().split(/\s+/);
  if (!name) return [];
  const command = commands[name.toLowerCase()];
  if (!command) return [`${name}: command not found. Type "help".`];
  return command.run({ ...ctx, args });
}

// Tab completion over command names and file names.
export function complete(input: string): string {
  const parts = input.split(" ");
  const last = parts[parts.length - 1] ?? "";
  const pool = parts.length === 1 ? Object.keys(commands).filter((c) => !commands[c]!.hidden) : [...Object.keys(files), ...appIds];
  const matches = pool.filter((p) => p.startsWith(last));
  if (matches.length !== 1) return input;
  parts[parts.length - 1] = matches[0]!;
  return parts.join(" ") + (parts.length === 1 ? " " : "");
}
