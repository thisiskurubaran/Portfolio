"use client";

import { education, experience, profile } from "@/content";
import { Icon } from "@/design/icons";
import { Card, Chips, Page, SectionHeader, Stat } from "@/os/apps/ui";
import { launch } from "@/os/system/launcher";

const initials = profile.name
  .split(" ")
  .map((p) => p[0])
  .join("");

export default function About() {
  const current = experience[0]!;
  const [status] = profile.status.split(".");
  return (
    <Page>
      <header className="flex flex-wrap items-center gap-5">
        <div
          aria-hidden
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[26px] font-display text-2xl font-bold text-white shadow-2"
          style={{ background: "linear-gradient(150deg, #6fd3ba, #1f8a74 55%, #12554a)" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {current.title.split(" (")[0]} at {current.company} · {profile.location}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success ring-1 ring-success/30">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
            {status}
          </p>
        </div>
      </header>

      <p className="max-w-prose text-[15px] leading-relaxed">{profile.bio}</p>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => launch("resume")} className="inline-flex items-center gap-1.5 rounded-control bg-accent px-3.5 py-2 text-sm font-medium text-on-accent hover:brightness-110">
          <Icon name="resume" size={16} /> Resume
        </button>
        <button onClick={() => launch("experience")} className="inline-flex items-center gap-1.5 rounded-control border border-line bg-glass px-3.5 py-2 text-sm font-medium hover:bg-glass-strong">
          <Icon name="experience" size={16} /> Experience
        </button>
        <button onClick={() => launch("contact")} className="inline-flex items-center gap-1.5 rounded-control border border-line bg-glass px-3.5 py-2 text-sm font-medium hover:bg-glass-strong">
          <Icon name="contact" size={16} /> Get in touch
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {profile.stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
      </dl>

      <section aria-label="What I work on">
        <SectionHeader title="What I work on" />
        <Chips items={profile.titles} />
      </section>

      <section aria-label="Education">
        <SectionHeader title="Education" />
        {education.map((e) => (
          <Card key={e.degree}>
            <p className="font-medium">{e.degree}</p>
            <p className="text-sm text-muted">
              {e.school} · {e.start} to {e.end} · {e.location}
            </p>
            <div className="mt-3">
              <Chips items={e.coursework} />
            </div>
          </Card>
        ))}
      </section>
    </Page>
  );
}
