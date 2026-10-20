"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { findEntry } from "@/content";
import type { Media } from "@/content/types";
import { ui } from "@/content/ui";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSceneStore } from "@/state/store";

function MediaItem({ item }: { item: Media }) {
  if (item.kind === "video") {
    // preload="none" keeps video bytes off the wire until someone presses play.
    return <video src={item.src} poster={item.poster} aria-label={item.alt} controls preload="none" playsInline />;
  }
  return (
    <Image src={item.src} alt={item.alt} width={item.width} height={item.height} sizes="(min-width: 768px) 380px, 90vw" />
  );
}

export function Panel() {
  const entry = useSceneStore((s) => findEntry(s.selectedId));
  const open = useSceneStore((s) => s.panelOpen);
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const wide = window.matchMedia("(min-width: 768px)").matches;
    const offscreen = wide ? { xPercent: 105, yPercent: 0 } : { xPercent: 0, yPercent: 105 };
    const duration = reducedMotion ? 0 : open ? 0.5 : 0.35;

    // Loaded on demand so GSAP stays out of the first chunk. The scene has
    // usually fetched it already, so this resolves from cache.
    import("gsap").then(({ gsap }) => {
      if (cancelled) return;
      if (open) {
        // Visible before focusing: browsers skip focus on hidden elements.
        gsap.set(el, { visibility: "visible" });
        gsap.fromTo(
          el,
          { ...offscreen, opacity: 0 },
          { xPercent: 0, yPercent: 0, opacity: 1, duration, ease: "power3.out", overwrite: true },
        );
        // Move focus to the title so screen readers start reading the ship.
        headingRef.current?.focus({ preventScroll: true });
      } else {
        // Hand focus back to the ship it came from, unless the visitor has
        // already moved it somewhere else.
        const active = document.activeElement;
        if (entry && (!active || active === document.body || el.contains(active))) {
          document.querySelector<HTMLElement>(`[data-ship="${entry.id}"]`)?.focus({ preventScroll: true });
        }
        gsap.to(el, {
          ...offscreen,
          opacity: 0,
          duration,
          ease: "power2.in",
          overwrite: true,
          onComplete: () => gsap.set(el, { visibility: "hidden" }),
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, entry, reducedMotion]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") useSceneStore.getState().closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <aside ref={ref} className="panel" aria-labelledby="panel-title" inert={!open}>
      {entry && (
        <>
          <button type="button" className="panel-close" onClick={() => useSceneStore.getState().closePanel()}>
            {ui.panel.close}
          </button>
          <p className="panel-kind">{ui.panel.kinds[entry.kind]}</p>
          <h2 id="panel-title" ref={headingRef} tabIndex={-1}>
            {entry.title}
          </h2>
          <p className="panel-summary">{entry.summary}</p>

          {entry.role && (
            <p className="panel-meta">
              <span>{ui.panel.role}</span> {entry.role}
            </p>
          )}

          {entry.stack && entry.stack.length > 0 && (
            <div className="panel-meta">
              <span>{ui.panel.stack}</span>
              <ul className="panel-stack">
                {entry.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {entry.links.length > 0 && (
            <ul className="panel-links" aria-label={ui.panel.links}>
              {entry.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {entry.media.length > 0 && (
            <div className="panel-media">
              {entry.media.slice(0, 3).map((m) => (
                <MediaItem key={m.src} item={m} />
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
