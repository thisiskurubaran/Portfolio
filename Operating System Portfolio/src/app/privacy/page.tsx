import type { Metadata } from "next";
import Link from "next/link";
import { privacy } from "@/content/privacy";
import styles from "../doc.module.css";

export const metadata: Metadata = {
  title: "Privacy",
  description: privacy.intro,
};

export default function Privacy() {
  return (
    <main className={styles.doc}>
      <h1>{privacy.title}</h1>
      <p>{privacy.intro}</p>
      <h2>What is stored</h2>
      {privacy.stored.map((item) => (
        <section key={item.what}>
          <h3>{item.what}</h3>
          <p className={styles.meta}>{item.where}</p>
          <p>{item.why}</p>
        </section>
      ))}
      <h2>Location</h2>
      <p>{privacy.location}</p>
      <h2>Security features</h2>
      <p>{privacy.security}</p>
      <p>{privacy.contact}</p>
      <ul className={styles.nav}>
        <li>
          <Link href="/">Back to kbOS</Link>
        </li>
        <li>
          <Link href="/plain">Plain view</Link>
        </li>
      </ul>
    </main>
  );
}
