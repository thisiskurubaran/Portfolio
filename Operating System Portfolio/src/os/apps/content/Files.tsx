"use client";

import { useState } from "react";
import { AppIcon } from "@/design/AppIcon";
import { Icon } from "@/design/icons";
import { folders, type FileEntry } from "@/os/apps/files/fs";
import { EmptyState } from "@/os/apps/ui";
import { launch } from "@/os/system/launcher";

function openFile(file: FileEntry) {
  if ("href" in file.open) window.open(file.open.href, "_blank", "noopener,noreferrer");
  else launch(file.open.app, file.open.anchor);
}

// F15: the portfolio as folders and files, with list and grid views and a preview.
export default function Files() {
  const [folderId, setFolderId] = useState(folders[0]!.id);
  const [view, setView] = useState<"list" | "grid">("list");
  const [selected, setSelected] = useState<string | null>(null);
  const folder = folders.find((f) => f.id === folderId)!;
  const file = folder.files.find((f) => f.name === selected) ?? null;

  const choose = (id: string) => {
    setFolderId(id);
    setSelected(null);
  };

  return (
    <div className="flex h-full min-h-[360px]">
      <nav aria-label="Folders" className="w-44 shrink-0 space-y-0.5 border-r border-line bg-raised/60 p-2 text-sm">
        <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-subtle">Places</p>
        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => choose(f.id)}
            aria-current={f.id === folderId || undefined}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left ${f.id === folderId ? "bg-accent/15 font-medium text-accent-fg" : "hover:bg-glass"}`}
          >
            <Icon name={f.icon} size={16} />
            <span className="flex-1 truncate">{f.name}</span>
            <span className="text-xs text-subtle">{f.files.length}</span>
          </button>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-sm">
          <span className="font-semibold">{folder.name}</span>
          <span className="text-xs text-muted">{folder.files.length} items</span>
          <div role="tablist" aria-label="View" className="ml-auto flex rounded-control border border-line bg-glass p-0.5">
            {(["list", "grid"] as const).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} aria-label={`${v} view`} onClick={() => setView(v)} className={`rounded-[8px] px-2 py-1 ${view === v ? "bg-surface shadow-1" : "text-muted"}`}>
                <Icon name={v === "list" ? "notes" : "launcher"} size={14} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-auto p-2">
            {folder.files.length === 0 ? (
              <EmptyState icon={folder.icon} title={`${folder.name} is empty`} body="Files appear here as they are added to the portfolio." />
            ) : view === "list" ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-subtle">
                    <th className="px-2 py-1.5 font-medium">Name</th>
                    <th className="hidden px-2 py-1.5 font-medium sm:table-cell">Kind</th>
                    <th className="hidden px-2 py-1.5 font-medium md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {folder.files.map((f) => (
                    <tr
                      key={f.name}
                      tabIndex={0}
                      aria-selected={selected === f.name}
                      onClick={() => setSelected(f.name)}
                      onDoubleClick={() => openFile(f)}
                      onKeyDown={(e) => (e.key === "Enter" ? openFile(f) : e.key === " " && setSelected(f.name))}
                      className={`cursor-default ${selected === f.name ? "bg-accent/15" : "hover:bg-glass"}`}
                    >
                      <td className="flex items-center gap-2 rounded-l-lg px-2 py-1.5">
                        <AppIcon id={f.tile} icon={f.icon} size={20} />
                        <span className="truncate">{f.name}</span>
                      </td>
                      <td className="hidden px-2 py-1.5 text-muted sm:table-cell">{f.kind}</td>
                      <td className="hidden rounded-r-lg px-2 py-1.5 text-muted md:table-cell">{f.modified ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
                {folder.files.map((f) => (
                  <li key={f.name}>
                    <button
                      onClick={() => setSelected(f.name)}
                      onDoubleClick={() => openFile(f)}
                      onKeyDown={(e) => e.key === "Enter" && openFile(f)}
                      className={`flex w-full flex-col items-center gap-1.5 rounded-lg p-2 text-center ${selected === f.name ? "bg-accent/15" : "hover:bg-glass"}`}
                    >
                      <AppIcon id={f.tile} icon={f.icon} size={44} />
                      <span className="line-clamp-2 text-xs">{f.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {file && (
            <aside aria-label="Preview" className="hidden w-64 shrink-0 flex-col border-l border-line bg-raised/60 p-4 md:flex">
              <AppIcon id={file.tile} icon={file.icon} size={48} />
              <p className="mt-3 break-words text-sm font-semibold">{file.name}</p>
              <p className="text-xs text-muted">{file.kind}</p>
              <pre className="mt-3 min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-lg bg-glass p-2.5 font-sans text-xs leading-relaxed text-muted">{file.preview}</pre>
              <button onClick={() => openFile(file)} className="mt-3 rounded-control bg-accent px-3 py-1.5 text-sm font-medium text-on-accent">
                {"href" in file.open ? "Open link" : "Open"}
              </button>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
