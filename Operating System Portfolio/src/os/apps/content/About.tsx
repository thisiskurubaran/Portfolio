import { profile } from "@/content";

export default function About() {
  const current = profile.status;
  return (
    <article className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">{profile.name}</h1>
        <p className="mt-1 text-sm opacity-70">{profile.location}</p>
        <p className="mt-3 inline-block rounded-full bg-accent/15 px-3 py-1 text-sm text-accent">{current}</p>
      </header>
      <p className="max-w-prose leading-relaxed">{profile.bio}</p>
      <dl className="grid grid-cols-2 gap-3">
        {profile.stats.map((stat) => (
          <div key={stat.label} className="rounded-control bg-glass p-3">
            <dt className="text-xs uppercase tracking-wide opacity-60">{stat.label}</dt>
            <dd className="mt-1 text-lg font-medium">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <section aria-label="Titles">
        <h2 className="mb-2 text-sm font-medium opacity-70">What I work on</h2>
        <ul className="flex flex-wrap gap-2">
          {profile.titles.map((title) => (
            <li key={title} className="rounded-full border border-white/15 px-3 py-1 text-sm">
              {title}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
