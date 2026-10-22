import { projects } from "@/content";

export default function Projects() {
  return (
    <ul className="space-y-4 p-6">
      {projects.map((project) => (
        <li key={project.id} className="rounded-control bg-glass p-4">
          <h2 className="text-lg font-medium">{project.name}</h2>
          <p className="mt-2 text-sm leading-relaxed">{project.description}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {project.tech.map((t) => (
              <li key={t} className="rounded-full border border-white/15 px-2 py-0.5 text-xs">
                {t}
              </li>
            ))}
          </ul>
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-accent underline">
              Open project
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
