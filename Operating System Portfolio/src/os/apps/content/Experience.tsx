import { experience, type Role } from "@/content";
import { Chips, Page, SectionHeader } from "@/os/apps/ui";
import { anchorId } from "@/os/system/launcher";

// Consecutive roles at one company read as a single stint with promotions.
function groupByCompany(roles: Role[]) {
  const groups: { company: string; roles: Role[] }[] = [];
  for (const role of roles) {
    const last = groups[groups.length - 1];
    if (last && last.company === role.company) last.roles.push(role);
    else groups.push({ company: role.company, roles: [role] });
  }
  return groups;
}

export default function Experience() {
  const groups = groupByCompany(experience);
  return (
    <Page>
      <SectionHeader title="Experience" detail={`${experience.length} roles, newest first`} />
      <ol className="relative space-y-6 border-l border-line pl-6">
        {groups.map((group) => (
          <li key={group.company + group.roles[0]!.id} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-surface ${group.roles[0] === experience[0] ? "bg-accent ring-4 ring-accent/20" : "bg-subtle"}`}
            />
            <p className="font-display text-[15px] font-semibold">{group.company}</p>
            <p className="mb-3 text-xs text-muted">
              {group.roles[group.roles.length - 1]!.start} to {group.roles[0]!.end} · {group.roles[0]!.location}
            </p>
            <div className="space-y-3">
              {group.roles.map((role) => (
                <article
                  key={role.id}
                  id={anchorId(`role-${role.id}`)}
                  className={`rounded-card border p-4 shadow-1 ${role === experience[0] ? "border-accent/40 bg-accent/[0.07]" : "border-line bg-raised"}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="font-semibold">{role.title}</h3>
                    <span className="text-xs tabular-nums text-muted">
                      {role.start} to {role.end}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{role.type}</p>
                  {role.badge && (
                    <p className="mt-2 inline-flex rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning ring-1 ring-warning/30">{role.badge}</p>
                  )}
                  {role.summary && <p className="mt-2.5 text-sm leading-relaxed">{role.summary}</p>}
                  <div className="mt-3">
                    <Chips items={role.skills} />
                  </div>
                </article>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </Page>
  );
}
