import { contact } from "@/content";

// External sites block framing, so the bookmarks open in a new tab.
export default function Browser() {
  return (
    <div className="p-6">
      <h2 className="mb-3 text-sm font-medium opacity-70">Bookmarks</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {contact.links.map((link) => (
          <li key={link.id}>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="block rounded-control bg-glass p-4 hover:bg-white/10">
              <span className="font-medium">{link.label}</span>
              <span className="block break-all text-xs opacity-60">{link.url}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
