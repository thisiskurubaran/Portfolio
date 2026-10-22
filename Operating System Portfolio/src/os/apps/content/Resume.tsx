"use client";

import { useEffect, useState } from "react";
import { contact } from "@/content";
import { Icon } from "@/design/icons";
import { ButtonLink, EmptyState } from "@/os/apps/ui";
import { launch } from "@/os/system/launcher";

const FILE = "Kurubaran_Anandhan_ATS_Resume.pdf";

// The viewer frames the PDF when it exists, and says plainly when it does not.
export default function Resume() {
  const [state, setState] = useState<"checking" | "ready" | "missing">("checking");

  useEffect(() => {
    fetch(contact.resume, { method: "HEAD" })
      .then((r) => setState(r.ok && (r.headers.get("content-type") ?? "").includes("pdf") ? "ready" : "missing"))
      .catch(() => setState("missing"));
  }, []);

  if (state === "missing") {
    return (
      <EmptyState
        icon="resume"
        title="The resume PDF is on its way"
        body="It has not been uploaded to this site yet. Everything it covers is in the Experience, Skills and Certifications apps."
        action={
          <button onClick={() => launch("experience")} className="rounded-control bg-accent px-3.5 py-2 text-sm font-medium text-on-accent">
            Open Experience
          </button>
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-line bg-raised px-4 py-2 text-sm">
        <Icon name="resume" size={16} className="text-muted" />
        <span className="truncate font-medium">{FILE}</span>
        <div className="ml-auto">
          <ButtonLink href={contact.resume} download={FILE} primary>
            <Icon name="download" size={15} /> Download
          </ButtonLink>
        </div>
      </div>
      {state === "ready" ? (
        <iframe title="Resume" src={contact.resume} className="min-h-0 w-full flex-1 bg-white" />
      ) : (
        <div className="folio-shimmer m-6 flex-1 rounded-card" />
      )}
    </div>
  );
}
