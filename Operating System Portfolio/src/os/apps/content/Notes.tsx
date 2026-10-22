import { notes } from "@/content/notes";
import { Card, EmptyState, Page, SectionHeader } from "@/os/apps/ui";

export default function Notes() {
  if (notes.length === 0) {
    return <EmptyState icon="notes" title="Notes will live here" body="Write-ups on things built and lessons learned will appear here as they are published." />;
  }
  return (
    <Page>
      <SectionHeader title="Notes" detail={`${notes.length} published`} />
      <ul className="space-y-3">
        {notes.map((note) => (
          <Card as="li" key={note.slug}>
            <h2 className="font-semibold">{note.title}</h2>
            <p className="text-xs text-muted">{note.date}</p>
            <p className="mt-2 text-sm leading-relaxed">{note.summary}</p>
          </Card>
        ))}
      </ul>
    </Page>
  );
}
