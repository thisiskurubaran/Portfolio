"use client";

import { useEffect, useRef, useState } from "react";

// F29: the secret app, found with the Konami code or `bowl` in the terminal.
// A nod to the net bowling in the bio: time the release to land a good length.
const ZONES = [
  { until: 0.12, name: "Full toss", runs: 4 },
  { until: 0.3, name: "Yorker", runs: 0, wicket: true },
  { until: 0.55, name: "Good length", runs: 0 },
  { until: 0.75, name: "Short of a length", runs: 1 },
  { until: 1, name: "Bouncer", runs: 6 },
] as const;

export default function Nets() {
  const [pos, setPos] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [score, setScore] = useState({ balls: 0, runs: 0, wickets: 0 });
  const raf = useRef(0);
  const start = useRef(0);
  const running = result === null;

  useEffect(() => {
    if (!running) return;
    start.current = performance.now();
    const tick = (t: number) => {
      // A ping-pong sweep, quicker as the over goes on.
      const speed = 0.0011 + score.balls * 0.00008;
      const p = ((t - start.current) * speed) % 2;
      setPos(p > 1 ? 2 - p : p);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [running, score.balls]);

  const bowl = () => {
    if (!running) {
      setResult(null);
      return;
    }
    cancelAnimationFrame(raf.current);
    const zone = ZONES.find((z) => pos <= z.until)!;
    const speed = Math.round(118 + Math.random() * 22);
    const wicket = "wicket" in zone && zone.wicket;
    setScore((s) => ({ balls: s.balls + 1, runs: s.runs + zone.runs, wickets: s.wickets + (wicket ? 1 : 0) }));
    setResult(`${zone.name} at ${speed} km/h. ${wicket ? "Bowled him!" : zone.runs ? `${zone.runs} run${zone.runs > 1 ? "s" : ""}.` : "Dot ball."}`);
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), bowl())}
      className="flex min-h-full flex-col items-center gap-5 bg-[#163b2a] p-6 text-[#f6f4ef] outline-none"
    >
      <p className="text-sm opacity-80">You found the nets. Release on a good length: press Space, Enter or tap.</p>
      <div className="relative h-64 w-24 rounded-md bg-[#c9b07a]" aria-hidden>
        {ZONES.map((z, i) => (
          <div key={z.name} className="absolute inset-x-0 border-t border-black/20 text-[9px] text-black/50" style={{ top: `${(i === 0 ? 0 : ZONES[i - 1]!.until) * 100}%` }}>
            {z.name}
          </div>
        ))}
        <div className="absolute left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-700 shadow" style={{ top: `${pos * 100}%` }} />
      </div>
      <button onClick={bowl} className="rounded-full bg-[#f6f4ef] px-6 py-2 text-sm font-medium text-[#163b2a]">
        {running ? "Bowl" : "Next ball"}
      </button>
      <p role="status" className="min-h-6 text-center">
        {result}
      </p>
      <p className="text-sm tabular-nums opacity-80">
        {Math.floor(score.balls / 6)}.{score.balls % 6} overs · {score.runs} runs · {score.wickets} wickets
      </p>
    </div>
  );
}
