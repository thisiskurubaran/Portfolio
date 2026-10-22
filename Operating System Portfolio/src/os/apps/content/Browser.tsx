import { contact } from "@/content";
import { Icon } from "@/design/icons";
import { Page, SectionHeader } from "@/os/apps/ui";

const brandTint: Record<string, string> = {
  linkedin: "linear-gradient(150deg, #5aa7e8, #1f6fb8)",
  github: "linear-gradient(150deg, #4b525c, #1c2026)",
  instagram: "linear-gradient(150deg, #f7b955, #e2508f 55%, #8a4fd6)",
  x: "linear-gradient(150deg, #3a3f46, #0b0d10)",
};

// External sites block framing, so bookmarks open in a new tab.
export default function Browser() {
  return (
    <Page>
      <SectionHeader title="Bookmarks" detail="These open in a new tab, since sites like these refuse to be framed." />
      <ul className="grid gap-3 sm:grid-cols-2">
        {contact.links.map((link) => (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-card border border-line bg-raised p-3.5 shadow-1 transition-colors hover:border-line-strong"
            >
              <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold text-white" style={{ background: brandTint[link.id] ?? brandTint.github }}>
                {link.label[0]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{link.label}</span>
                <span className="block truncate text-xs text-muted">{link.url.replace(/^https:\/\/(www\.)?/, "")}</span>
              </span>
              <Icon name="share" size={16} className="text-muted group-hover:text-paper" />
            </a>
          </li>
        ))}
      </ul>
    </Page>
  );
}
