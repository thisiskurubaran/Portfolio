import { contact } from "@/content";

// The PDF is not in public/ yet. The viewer frames it once the file exists.
export default function Resume() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-2 text-sm">
        <span className="opacity-70">Kurubaran_Anandhan_ATS_Resume.pdf</span>
        <a href={contact.resume} download="Kurubaran_Anandhan_ATS_Resume.pdf" className="rounded-control bg-accent px-3 py-1 font-medium text-on-accent">
          Download
        </a>
      </div>
      <iframe title="Resume" src={contact.resume} className="min-h-0 w-full flex-1 bg-white" />
    </div>
  );
}
