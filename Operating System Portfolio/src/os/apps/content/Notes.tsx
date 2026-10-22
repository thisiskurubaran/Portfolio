import { notes } from "@/content/notes";

export default function Notes() {
  if (notes.length === 0) {
    return <p className="p-6 text-sm opacity-70">No notes published yet.</p>;
  }
  return (
    <ul className="space-y-3 p-6">
      {notes.map((note) => (
        <li key={note.slug} className="rounded-control bg-glass p-4">
          <h2 className="font-medium">{note.title}</h2>
          <p className="text-xs opacity-60">{note.date}</p>
          <p className="mt-2 text-sm">{note.summary}</p>
        </li>
      ))}
    </ul>
  );
}
