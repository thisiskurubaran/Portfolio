import { skills } from "@/content";

export default function Skills() {
  return (
    <div className="grid gap-4 p-6 sm:grid-cols-2">
      {Object.entries(skills).map(([category, items]) => (
        <section key={category} className="rounded-control bg-glass p-4">
          <h2 className="mb-2 text-sm font-medium">{category}</h2>
          <ul className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <li key={item} className="rounded-full border border-white/15 px-2 py-0.5 text-xs">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
