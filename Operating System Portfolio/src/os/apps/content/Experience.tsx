import { experience } from "@/content";
import { anchorId } from "@/os/system/launcher";

export default function Experience() {
  return (
    <ol className="space-y-4 p-6">
      {experience.map((role, i) => (
        <li
          key={role.id}
          id={anchorId(`role-${role.id}`)}
          className={`rounded-control p-4 ${i === 0 ? "bg-accent/10 ring-1 ring-accent/40" : "bg-glass"}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-medium">{role.title}</h2>
            <span className="text-xs tabular-nums opacity-60">
              {role.start} to {role.end}
            </span>
          </div>
          <p className="text-sm opacity-80">
            {role.company} · {role.type} · {role.location}
          </p>
          {role.badge && (
            <p className="mt-2 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent-fg">{role.badge}</p>
          )}
          {role.summary && <p className="mt-3 text-sm leading-relaxed">{role.summary}</p>}
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {role.skills.map((skill) => (
              <li key={skill} className="rounded-full border border-line px-2 py-0.5 text-xs">
                {skill}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
