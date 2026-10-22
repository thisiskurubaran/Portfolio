import { contact } from "@/content";

// The send pipeline (validation, rate limit, moderation) lands in v0.11.0.
// Until then the form is disabled instead of pretending to send.
export default function Mail() {
  return (
    <div className="space-y-5 p-6">
      <form aria-describedby="mail-note" className="space-y-3">
        <label className="block text-sm">
          Your email
          <input disabled type="email" className="mt-1 w-full rounded-control bg-glass p-2 disabled:opacity-50" />
        </label>
        <label className="block text-sm">
          Message
          <textarea disabled rows={5} className="mt-1 w-full rounded-control bg-glass p-2 disabled:opacity-50" />
        </label>
        <button disabled className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-on-accent disabled:opacity-40">
          Send
        </button>
        <p id="mail-note" className="text-sm opacity-70">
          Sending is not connected yet, so nothing leaves this form. Reach me through one of these:
        </p>
      </form>
      <ul className="flex flex-wrap gap-3">
        {contact.links.map((link) => (
          <li key={link.id}>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1 text-sm hover:bg-glass-strong">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
