"use client";

import { useEffect, useState } from "react";
import { getApp } from "@/os/apps/registry";
import { Card, Page, SectionHeader, Stat } from "@/os/apps/ui";
import { useWindows } from "@/os/state/windows";
import { usePower } from "@/os/system/power";
import { usePresence } from "@/os/system/presence";
import { useNetwork } from "@/os/system/status";

type Memory = { usedJSHeapSize: number; jsHeapSizeLimit: number };

// Frames per second over the last second, sampled with requestAnimationFrame.
function useFps() {
  const [history, setHistory] = useState<number[]>([]);
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      frames++;
      if (t - last >= 1000) {
        const fps = Math.round((frames * 1000) / (t - last));
        setHistory((h) => [...h.slice(-29), fps]);
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return history;
}

function Sparkline({ values, max = 60 }: { values: number[]; max?: number }) {
  if (values.length < 2) return <div className="h-12" />;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${40 - (Math.min(v, max) / max) * 36}`).join(" ");
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-12 w-full" aria-hidden>
      <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// F26: real numbers only. Anything the browser does not report says so.
export default function Activity() {
  const fps = useFps();
  const windows = useWindows((s) => s.windows);
  const network = useNetwork();
  const online = usePresence((s) => (s.connected ? s.count : null));
  const lowPower = usePower((s) => s.lowPower);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const read = () => {
      setMemory((performance as Performance & { memory?: Memory }).memory ?? null);
      setUptime(performance.now());
    };
    read();
    const id = window.setInterval(read, 1000);
    return () => window.clearInterval(id);
  }, []);

  const current = fps[fps.length - 1];
  const mins = Math.floor(uptime / 60000);
  return (
    <Page>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Frame rate" value={current ? `${current} fps` : "Measuring"} />
        <Stat label="JS memory" value={memory ? `${Math.round(memory.usedJSHeapSize / 1048576)} MB` : "Not reported"} />
        <Stat label="Network" value={network.online ? (network.type?.toUpperCase() ?? "Online") : "Offline"} />
        <Stat label="Uptime" value={mins ? `${mins} min` : `${Math.round(uptime / 1000)} s`} />
      </dl>
      <Card>
        <SectionHeader title="Frame rate" detail="Last 30 seconds" />
        <Sparkline values={fps} />
      </Card>
      <Card>
        <SectionHeader title="Open windows" detail={windows.length ? `${windows.length} on folioDesk` : "Window counts come from folioDesk"} />
        <ul className="divide-y divide-line text-sm">
          {windows.map((w) => (
            <li key={w.id} className="flex justify-between py-2">
              {getApp(w.appId)?.name}
              <span className="text-muted">{w.minimized ? "Minimised" : w.maximized ? "Maximised" : `${w.width} × ${w.height}`}</span>
            </li>
          ))}
        </ul>
      </Card>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="CPU threads" value={String(navigator.hardwareConcurrency ?? "Not reported")} />
        <Stat label="Visitors online" value={online ? String(online) : "Not connected"} />
        <Stat label="Low-power mode" value={lowPower ? "On" : "Off"} />
      </dl>
    </Page>
  );
}
