import type { Metadata } from "next";
import Link from "next/link";
import { privacy } from "@/content/privacy";
import { profile } from "@/content/profile";
import { ui } from "@/content/ui";
import styles from "../doc.module.css";

export const metadata: Metadata = {
  title: `${profile.name}: ${privacy.title}`,
  description: privacy.intro,
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/">{ui.plain.back}</Link>
        <Link href="/plain">{ui.plain.title}</Link>
      </nav>
      <h1>{privacy.title}</h1>
      <p className={styles.lead}>{privacy.intro}</p>

      {privacy.sections.map((s) => (
        <section key={s.heading}>
          <h2>{s.heading}</h2>
          <ul>
            {s.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}

      <footer className={styles.footer}>
        {privacy.updatedLabel} <time dateTime={privacy.updated}>{privacy.updated}</time>
      </footer>
    </main>
  );
}
