"use client";

import { useEffect, useState } from "react";
import { profile } from "@/content";
import { LogoMark, Wordmark } from "@/design/Logo";
import { shells } from "@/os/device/shells";
import { useDevice } from "@/os/device/useDevice";
import { Card, Page } from "@/os/apps/ui";
import { useResolvedTheme } from "@/os/system/useSystemAttributes";

const VERSION = process.env.NEXT_PUBLIC_FOLIOOS_VERSION ?? "dev";
const REPO = "https://github.com/thisiskurubaran/Portfolio";

function browserName() {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string; version: string }[] } }).userAgentData?.brands;
  const brand = brands?.find((b) => !/not.?a.?brand|chromium/i.test(b.brand));
  if (brand) return `${brand.brand} ${brand.version}`;
  const ua = navigator.userAgent;
  if (/firefox\/(\d+)/i.test(ua)) return `Firefox ${RegExp.$1}`;
  if (/version\/(\d+).*safari/i.test(ua)) return `Safari ${RegExp.$1}`;
  return "Unknown browser";
}

// F27: what this system is, where it runs, and who made it.
export default function SysInfo() {
  const { shell } = useDevice();
  const theme = useResolvedTheme();
  const [env, setEnv] = useState<{ browser: string; screen: string; dpr: number } | null>(null);
  useEffect(() => {
    // Browser details only exist on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnv({ browser: browserName(), screen: `${window.screen.width} × ${window.screen.height}`, dpr: window.devicePixelRatio });
  }, []);
  const rows: [string, string][] = [
    ["Version", VERSION],
    ["Shell", shells.find((s) => s.id === shell)?.name ?? "Detecting"],
    ["Theme", theme === "dark" ? "Dark" : "Light"],
    ["Browser", env?.browser ?? ""],
    ["Screen", env ? `${env.screen} at ${env.dpr}x` : ""],
    ["Owner", profile.name],
  ];
  return (
    <Page>
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <LogoMark variant="tile" size={84} />
        <Wordmark className="text-3xl" />
        <p className="max-w-sm text-sm text-muted">A portfolio built as an operating system. One kernel, four shells, the same real content everywhere.</p>
      </div>
      <Card className="p-0">
        <dl className="divide-y divide-line text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <p className="text-center text-xs text-muted">
        Built with Next.js, React, Zustand and a little Three.js.{" "}
        <a href={REPO} target="_blank" rel="noopener noreferrer" className="text-accent-fg underline">
          Source code
        </a>
      </p>
    </Page>
  );
}
