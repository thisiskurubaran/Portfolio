import type { Metadata } from "next";
import Link from "next/link";
import { certifications } from "@/content/certifications";
import { contactLinks } from "@/content/contact";
import { debris } from "@/content/debris";
import { deepDives } from "@/content/surface";
import { education } from "@/content/education";
import { experience } from "@/content/experience";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { skillGroups } from "@/content/skills";
import { stations } from "@/content/stations";
import { stops } from "@/content/stops";
import { ui } from "@/content/ui";
import styles from "../doc.module.css";

export const metadata: Metadata = {
  title: `${profile.name}: ${ui.plain.title}`,
  description: ui.plain.intro,
};

/** Everything in the mission as plain HTML: no WebGL, no physics, no client script needed. */
export default function PlainPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Pages">
        <Link href="/">{ui.plain.back}</Link>
        <Link href="/privacy">{ui.plain.privacy}</Link>
      </nav>
      <h1>{profile.name}</h1>
      <p className={styles.lead}>
        {profile.status} {ui.plain.intro}
      </p>

      <section aria-labelledby="about">
        <h2 id="about">{ui.plain.about}</h2>
        <p>{profile.bio}</p>
        <p className={styles.meta}>{profile.location}</p>
        <dl className={styles.stats}>
          {profile.stats.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.meta}>
          {ui.plain.titles}: {profile.titles.join(", ")}
        </p>
      </section>

      <section aria-labelledby="experience">
        <h2 id="experience">{ui.plain.experience}</h2>
        {experience.map((r) => (
          <article key={`${r.company}${r.title}${r.start}`} className={styles.entry}>
            <h3>
              {r.title}, {r.company}
            </h3>
            {r.fullTitle && <p className={styles.meta}>{r.fullTitle}</p>}
            <p className={styles.meta}>
              {r.type} · {r.start} to {r.end ?? ui.plain.present} · {r.location}
            </p>
            {r.badge && <p className={styles.tag}>{r.badge}</p>}
            {r.summary && <p>{r.summary}</p>}
            {r.highlights && (
              <ul>
                {r.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
            <ul className={styles.chips} aria-label={ui.plain.skills}>
              {r.skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section aria-labelledby="projects">
        <h2 id="projects">{ui.plain.projects}</h2>
        {projects.map((p) => (
          <article key={p.id} className={styles.entry}>
            <h3>{p.name}</h3>
            <p>{p.summary}</p>
            {p.parts && <p className={styles.meta}>{p.parts.join(", ")}</p>}
            <ul className={styles.chips}>
              {p.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {p.url ? (
              <p>
                <a href={p.url} rel="noopener noreferrer">
                  {p.url}
                </a>
              </p>
            ) : (
              <p className={styles.meta}>{ui.plain.noLink}</p>
            )}
          </article>
        ))}
      </section>

      <section aria-labelledby="skills">
        <h2 id="skills">{ui.plain.skills}</h2>
        {skillGroups.map((g) => (
          <div key={g.id} className={styles.entry}>
            <h3>{g.name}</h3>
            <ul className={styles.chips}>
              {g.skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="education">
        <h2 id="education">{ui.plain.education}</h2>
        {education.map((e) => (
          <article key={e.school} className={styles.entry}>
            <h3>
              {e.degree}, {e.field}
            </h3>
            <p className={styles.meta}>
              {e.school} · {e.start} to {e.end} · {e.location}
            </p>
            <p className={styles.meta}>
              {ui.plain.coursework}: {e.coursework.join(", ")}
            </p>
          </article>
        ))}
      </section>

      <section aria-labelledby="certifications">
        <h2 id="certifications">{ui.plain.certifications}</h2>
        {certifications.map((c) => (
          <article key={c.name} className={styles.entry}>
            <h3>{c.name}</h3>
            <p className={styles.meta}>
              {c.issuer} · {c.date} · {c.tag}
            </p>
            {c.credentialId && (
              <p className={styles.meta}>
                {ui.plain.credential}: {c.credentialId}
              </p>
            )}
            {c.url && (
              <p>
                <a href={c.url} rel="noopener noreferrer">
                  {ui.plain.verify}
                </a>
              </p>
            )}
          </article>
        ))}
      </section>

      <section aria-labelledby="route">
        <h2 id="route">{ui.plain.route}</h2>
        <p>{ui.plain.routeIntro}</p>
        <ul>
          {stops.map((s) => (
            <li key={s.id}>
              <strong>{s.name}</strong> ({s.reference}): {s.what}
            </li>
          ))}
          {stations.map((s) => (
            <li key={s.id}>{s.name}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="surface">
        <h2 id="surface">{ui.plain.surface}</h2>
        <p>{ui.plain.surfaceIntro}</p>
        <ul>
          {deepDives.map((d) => (
            <li key={d.id}>
              <strong>{d.name}</strong>:{" "}
              {experience
                .filter((r) => r.skills.some((s) => d.skills.includes(s)))
                .map((r) => `${r.title}, ${r.company}`)
                .join("; ")}
            </li>
          ))}
        </ul>
      </section>

      {/* Shown only once the owner adds entries; nothing here is invented. */}
      {debris.length > 0 && (
        <section aria-labelledby="debris">
          <h2 id="debris">{ui.plain.debris}</h2>
          {debris.map((d) => (
            <article key={d.id}>
              <h3>{d.name}</h3>
              {d.years && <p>{d.years}</p>}
              <p>{d.summary}</p>
              <p>
                <strong>{ui.plain.wentWrong}:</strong> {d.wentWrong}
              </p>
              <p>
                <strong>{ui.plain.learned}:</strong> {d.learned}
              </p>
            </article>
          ))}
        </section>
      )}

      <section aria-labelledby="contact">
        <h2 id="contact">{ui.plain.contact}</h2>
        <ul className={styles.links}>
          {contactLinks.map((c) => (
            <li key={c.label}>
              <a href={c.url} rel="noopener noreferrer">
                {c.label}: {c.handle}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
