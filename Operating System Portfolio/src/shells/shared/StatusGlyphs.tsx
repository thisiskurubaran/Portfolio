"use client";

import { useBattery, useNetwork } from "@/os/system/status";

const BARS: Record<string, number> = { "slow-2g": 1, "2g": 2, "3g": 3, "4g": 4 };

// Original status bar glyphs, drawn from what the browser reports: signal
// strength from the connection type, Wi-Fi when online, the real battery
// level when the Battery API exists. Nothing is faked; missing data hides.
export function StatusGlyphs({ size = 1 }: { size?: number }) {
  const network = useNetwork();
  const battery = useBattery();
  const bars = network.online ? (network.type ? (BARS[network.type] ?? 4) : 4) : 0;
  const h = 11 * size;
  return (
    <span className="flex items-center gap-[5px]" aria-label={`${network.online ? "Online" : "Offline"}${battery ? `, battery ${Math.round(battery.level * 100)}%` : ""}`}>
      <svg width={17 * size} height={h} viewBox="0 0 17 11" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 4.5} y={8 - i * 2.6} width="3" height={3 + i * 2.6} rx="1" fill="currentColor" opacity={i < bars ? 1 : 0.3} />
        ))}
      </svg>
      {network.online && (
        <svg width={15 * size} height={h} viewBox="0 0 15 11" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M1.3 4.2a9 9 0 0 1 12.4 0" />
          <path d="M3.6 6.6a5.6 5.6 0 0 1 7.8 0" />
          <circle cx="7.5" cy="9.3" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      )}
      {battery && (
        <svg width={26 * size} height={h + 1} viewBox="0 0 26 12" aria-hidden>
          <rect x="0.6" y="0.6" width="22" height="10.8" rx="3.2" fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.2" />
          <rect x="2.2" y="2.2" width={Math.max(2, 18.8 * battery.level)} height="7.6" rx="1.8" fill={battery.level <= 0.2 && !battery.charging ? "var(--color-sys-red)" : "currentColor"} />
          <path d="M24 4v4c.9-.3 1.4-1 1.4-2s-.5-1.7-1.4-2z" fill="currentColor" opacity="0.45" />
          {battery.charging && <path d="M12.6 1.8 9 6.6h2.6l-1 3.8 3.6-4.8h-2.6z" fill="var(--color-ink)" />}
        </svg>
      )}
    </span>
  );
}
