import { projects } from "@/content";
import { AppIcon } from "@/design/AppIcon";
import { ButtonLink, Chips, Page, SectionHeader } from "@/os/apps/ui";
import { anchorId } from "@/os/system/launcher";

export default function Projects() {
  return (
    <Page>
      <SectionHeader title="Projects" detail={projects.length === 1 ? "One featured project" : `${projects.length} projects`} />
      <ul className="space-y-5">
        {projects.map((project) => (
          <li key={project.id} id={anchorId(`project-${project.id}`)} className="overflow-hidden rounded-card border border-line bg-raised shadow-2">
            <div
              className="relative flex h-32 items-end gap-3 p-5"
              style={{ background: "radial-gradient(circle at 85% 20%, #6fd3ba66, transparent 45%), radial-gradient(circle at 10% 90%, #7f8cff55, transparent 50%), linear-gradient(135deg, #12554a, #0b3b33)" }}
            >
              <AppIcon id="projects" icon="projects" size={52} />
              <div className="text-white">
                <h3 className="font-display text-xl font-bold">{project.name}</h3>
                <p className="text-xs text-white/75">{project.tech.slice(0, 3).join(" · ")}</p>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-[15px] leading-relaxed">{project.description}</p>
              <Chips items={project.tech} />
              {project.url ? (
                <ButtonLink href={project.url} primary>
                  Open {project.name}
                </ButtonLink>
              ) : (
                <p className="text-xs text-muted">Private project, so there is no public link.</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Page>
  );
}
