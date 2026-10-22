import type { Metadata } from "next";
import Link from "next/link";
import { certifications, contact, education, experience, profile, projects, skills } from "@/content";
import { notes } from "@/content/notes";
import styles from "../doc.module.css";

export const metadata: Metadata = {
  title: `${profile.name}: plain view`,
  description: "Everything from kbOS as one simple page: about, experience, projects, skills, certifications, notes and contact.",
};

const SECTIONS = [
  ["about", "About"],
  ["experience", "Experience"],
  ["projects", "Projects"],
  ["skills", "Skills"],
  ["certifications", "Certifications"],
  ["education", "Education"],
  ["notes", "Notes"],
  ["contact", "Contact"],
] as const;

// The whole portfolio as semantic HTML: no OS chrome, no client JavaScript.
export default function Plain() {
  return (
    <main className={styles.doc}>
      <header>
        <h1>{profile.name}</h1>
        <p className={styles.meta}>
          {profile.titles[0]} · {profile.location}
        </p>
        <nav aria-label="Sections">
          <ul className={styles.nav}>
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
            <li>
              <Link href="/">Open kbOS</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
          </ul>
        </nav>
      </header>

      <section id="about" aria-labelledby="about-h">
        <h2 id="about-h">About</h2>
        <p>
          <strong>{profile.status}</strong>
        </p>
        <p>{profile.bio}</p>
        <ul>
          {profile.stats.map((s) => (
            <li key={s.label}>
              {s.label}: {s.value}
            </li>
          ))}
        </ul>
        <p className={styles.tags}>{profile.titles.join(" · ")}</p>
      </section>

      <section id="experience" aria-labelledby="experience-h">
        <h2 id="experience-h">Experience</h2>
        {experience.map((role) => (
          <article key={role.id}>
            <h3>
              {role.title}, {role.company}
            </h3>
            <p className={styles.meta}>
              {role.type} · {role.start} to {role.end} · {role.location}
              {role.badge && ` · ${role.badge}`}
            </p>
            {role.summary && <p>{role.summary}</p>}
            <p className={styles.tags}>{role.skills.join(", ")}</p>
          </article>
        ))}
      </section>

      <section id="projects" aria-labelledby="projects-h">
        <h2 id="projects-h">Projects</h2>
        {projects.map((p) => (
          <article key={p.id}>
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <p className={styles.tags}>{p.tech.join(", ")}</p>
            {p.url && <a href={p.url}>Open {p.name}</a>}
          </article>
        ))}
      </section>

      <section id="skills" aria-labelledby="skills-h">
        <h2 id="skills-h">Skills</h2>
        {Object.entries(skills).map(([category, items]) => (
          <div key={category}>
            <h3>{category}</h3>
            <p>{items.join(", ")}</p>
          </div>
        ))}
      </section>

      <section id="certifications" aria-labelledby="certifications-h">
        <h2 id="certifications-h">Certifications</h2>
        <ul>
          {certifications.map((c) => (
            <li key={c.name}>
              {c.name}, {c.issuer}, {c.date}
              {c.verified && ", verified"}
              {c.url && (
                <>
                  {" "}
                  (<a href={c.url}>verify</a>)
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section id="education" aria-labelledby="education-h">
        <h2 id="education-h">Education</h2>
        {education.map((e) => (
          <article key={e.degree}>
            <h3>
              {e.degree}, {e.school}
            </h3>
            <p className={styles.meta}>
              {e.start} to {e.end} · {e.location}
            </p>
            <p className={styles.tags}>Coursework: {e.coursework.join(", ")}</p>
          </article>
        ))}
      </section>

      <section id="notes" aria-labelledby="notes-h">
        <h2 id="notes-h">Notes</h2>
        {notes.length === 0 ? (
          <p>No notes published yet.</p>
        ) : (
          notes.map((n) => (
            <article key={n.slug}>
              <h3>{n.title}</h3>
              <p className={styles.meta}>{n.date}</p>
              <p>{n.summary}</p>
            </article>
          ))
        )}
      </section>

      <section id="contact" aria-labelledby="contact-h">
        <h2 id="contact-h">Contact</h2>
        <ul>
          {contact.links.map((l) => (
            <li key={l.id}>
              <a href={l.url} rel="noopener noreferrer">
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href={contact.resume}>Resume (PDF)</a>
          </li>
        </ul>
      </section>
    </main>
  );
}
