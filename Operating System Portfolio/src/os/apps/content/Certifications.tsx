import { certifications } from "@/content";

export default function Certifications() {
  return (
    <ul className="space-y-3 p-6">
      {certifications.map((cert) => (
        <li key={cert.name} className="rounded-control bg-glass p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-medium">{cert.name}</h2>
            <span className="text-xs opacity-60">{cert.date}</span>
          </div>
          <p className="text-sm opacity-80">
            {cert.issuer} · {cert.tag}
            {cert.verified && " · Verified"}
          </p>
          {cert.credentialId && <p className="mt-1 break-all text-xs opacity-60">Credential: {cert.credentialId}</p>}
          {cert.url && (
            <a href={cert.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-accent underline">
              Verify credential
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
