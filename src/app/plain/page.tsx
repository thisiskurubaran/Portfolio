import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { entries, hiddenEntries } from "@/content";
import { profile } from "@/content/profile";
import type { Entry, ShipKind } from "@/content/types";
import { ui } from "@/content/ui";
import styles from "../doc.module.css";

export const metadata: Metadata = {
  title: `${profile.name}: ${ui.plain.title}`,
  description: ui.plain.intro,
};

const ORDER: ShipKind[] = ["cargo", "fishing", "sailboat", "rowboat"];

function EntryBlock({ entry }: { entry: Entry }) {
  return (
    <article className={styles.entry} id={entry.id}>
      <h3>{entry.title}</h3>
      <p className={styles.tag}>{entry.tag}</p>
      <p>{entry.summary}</p>
      {entry.role && (
        <p className={styles.meta}>
          {ui.panel.role}: {entry.role}
        </p>
      )}
      {entry.stack && entry.stack.length > 0 && (
        <p className={styles.meta}>
          {ui.panel.stack}: {entry.stack.join(", ")}
        </p>
      )}
      {entry.links.length > 0 && (
        <ul className={styles.links}>
          {entry.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} rel="noopener noreferrer">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      {entry.media.length > 0 && (
        <div className={styles.media}>
          {entry.media.map((m) =>
            m.kind === "image" ? (
              <Image key={m.src} src={m.src} alt={m.alt} width={m.width} height={m.height} sizes="(min-width: 720px) 688px, 100vw" />
            ) : (
              <video key={m.src} src={m.src} poster={m.poster} aria-label={m.alt} controls preload="none" playsInline />
            ),
          )}
        </div>
      )}
    </article>
  );
}

export default function PlainPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/">{ui.plain.back}</Link>
        <Link href="/privacy">{ui.plain.privacy}</Link>
      </nav>
      <h1>{profile.name}</h1>
      <p className={styles.lead}>
        {profile.role}. {ui.plain.intro}
      </p>

      {ORDER.map((kind) => {
        const list = entries.filter((e) => e.kind === kind);
        if (list.length === 0) return null;
        return (
          <section key={kind} aria-labelledby={`section-${kind}`}>
            <h2 id={`section-${kind}`}>{ui.plain.sections[kind]}</h2>
            {list.map((e) => (
              <EntryBlock key={e.id} entry={e} />
            ))}
          </section>
        );
      })}

      <section aria-labelledby="section-hidden">
        <h2 id="section-hidden">{ui.plain.hidden}</h2>
        {hiddenEntries.map((e) => (
          <EntryBlock key={e.id} entry={e} />
        ))}
      </section>

      <footer className={styles.footer}>
        <Link href="/privacy">{ui.plain.privacy}</Link>
      </footer>
    </main>
  );
}
