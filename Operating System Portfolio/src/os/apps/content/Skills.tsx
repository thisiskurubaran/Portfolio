"use client";

import { useState } from "react";
import { skills } from "@/content";
import { Card, Chips, Page, SectionHeader } from "@/os/apps/ui";
import { anchorId } from "@/os/system/launcher";
import { slug } from "@/os/system/search";

const total = new Set(Object.values(skills).flat()).size;

// skills.json, coloured by hand so it needs no highlighter library.
function JsonView() {
  const entries = Object.entries(skills);
  return (
    <pre className="overflow-auto rounded-card border border-line bg-[#0b0e12] p-4 font-mono text-[13px] leading-relaxed text-[#d7dee7]">
      <span className="text-[#7a8490]">{"// skills.json\n"}</span>
      {"{\n"}
      {entries.map(([category, items], i) => (
        <span key={category} id={anchorId(`skills-${slug(category)}`)}>
          {"  "}
          <span className="text-[#6fd3ba]">&quot;{category}&quot;</span>
          {": [\n"}
          {items.map((item, j) => (
            <span key={item}>
              {"    "}
              <span className="text-[#f7b955]">&quot;{item}&quot;</span>
              {j < items.length - 1 ? ",\n" : "\n"}
            </span>
          ))}
          {i < entries.length - 1 ? "  ],\n" : "  ]\n"}
        </span>
      ))}
      {"}"}
    </pre>
  );
}

export default function Skills() {
  // On a desktop-sized window the code view is the default, as a developer would expect.
  const [view, setView] = useState<"grid" | "json">(() => (typeof window !== "undefined" && window.innerWidth >= 1024 ? "json" : "grid"));
  return (
    <Page wide>
      <SectionHeader
        title="Skills"
        detail={`${total} skills in ${Object.keys(skills).length} groups`}
        action={
          <div role="tablist" aria-label="View" className="flex rounded-control border border-line bg-glass p-0.5 text-xs font-medium">
            {(["grid", "json"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-[8px] px-2.5 py-1 ${view === v ? "bg-surface shadow-1" : "text-muted"}`}
              >
                {v === "grid" ? "Grid" : "skills.json"}
              </button>
            ))}
          </div>
        }
      />
      {view === "json" ? (
        <JsonView />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(skills).map(([category, items]) => (
            <Card as="section" key={category} id={anchorId(`skills-${slug(category)}`)}>
              <h3 className="mb-2.5 flex items-center justify-between text-sm font-semibold">
                {category}
                <span className="text-xs font-normal text-muted">{items.length}</span>
              </h3>
              <Chips items={items} />
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}
