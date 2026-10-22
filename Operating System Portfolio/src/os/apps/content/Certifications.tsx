import { certifications } from "@/content";
import { Icon } from "@/design/icons";
import { ButtonLink, Chip, Page, SectionHeader } from "@/os/apps/ui";
import { anchorId } from "@/os/system/launcher";
import { slug } from "@/os/system/search";

export default function Certifications() {
  return (
    <Page>
      <SectionHeader title="Certifications" detail={`${certifications.length} verified credentials`} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {certifications.map((cert) => (
          <li key={cert.name} id={anchorId(`cert-${slug(cert.name)}`)} className="flex flex-col rounded-card border border-line bg-raised p-4 shadow-1">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold text-[#3b2a05] ring-4 ring-[#ffd36b]/25"
                style={{ background: "linear-gradient(150deg, #ffe39a, #e0a830)" }}
              >
                {cert.issuer[0]}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-snug">{cert.name}</h3>
                <p className="text-xs text-muted">
                  {cert.issuer} · {cert.date}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Chip>{cert.tag}</Chip>
              {cert.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                  <Icon name="certifications" size={13} /> Verified
                </span>
              )}
            </div>
            {cert.credentialId && <p className="mt-2 break-all font-mono text-[11px] text-subtle">{cert.credentialId}</p>}
            {cert.url && (
              <div className="mt-auto pt-3">
                <ButtonLink href={cert.url}>Verify credential</ButtonLink>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Page>
  );
}
