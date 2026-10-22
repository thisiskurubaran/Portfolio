"use client";

import { useEffect, useState } from "react";
import { ensureClockTicking, formatDuration, useClockStore } from "@/os/apps/clock/store";
import { Card, Page } from "@/os/apps/ui";
import { formatInZone, useClock, worldZones } from "@/os/system/clock";

type Tab = "world" | "timer" | "stopwatch" | "alarm";
const TABS: { id: Tab; label: string }[] = [
  { id: "world", label: "World" },
  { id: "timer", label: "Timer" },
  { id: "stopwatch", label: "Stopwatch" },
  { id: "alarm", label: "Alarm" },
];

const btn = "rounded-control px-4 py-2 text-sm font-medium";
const primary = `${btn} bg-accent text-on-accent hover:brightness-110`;
const secondary = `${btn} border border-line bg-glass hover:bg-glass-strong`;

function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

function World() {
  const now = useClock(1000);
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      <Card as="li" className="sm:col-span-2">
        <p className="text-xs text-muted">Your time · {localZone.replace(/_/g, " ")}</p>
        <p className="font-display text-4xl font-semibold tabular-nums" suppressHydrationWarning>
          {now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}
        </p>
      </Card>
      {worldZones.map((z) => (
        <Card as="li" key={z.zone}>
          <p className="text-xs text-muted">{z.city}</p>
          <p className="font-display text-2xl font-semibold tabular-nums" suppressHydrationWarning>
            {now ? formatInZone(now, z.zone) : ""}
          </p>
        </Card>
      ))}
    </ul>
  );
}

function Timer() {
  const { timerEnd, timerPausedLeft, startTimer, pauseTimer, resumeTimer, cancelTimer } = useClockStore();
  const now = useNow(250);
  const [minutes, setMinutes] = useState(5);
  const running = timerEnd !== null;
  const left = running ? timerEnd - now : (timerPausedLeft ?? minutes * 60_000);
  return (
    <Card className="flex flex-col items-center gap-5 py-8">
      <p className="font-display text-6xl font-semibold tabular-nums">{formatDuration(left)}</p>
      {!running && timerPausedLeft === null && (
        <div className="flex flex-wrap justify-center gap-2">
          {[1, 5, 10, 25].map((m) => (
            <button key={m} onClick={() => setMinutes(m)} className={`rounded-full px-3 py-1 text-sm ${minutes === m ? "bg-accent text-on-accent" : "bg-glass ring-1 ring-line"}`}>
              {m} min
            </button>
          ))}
          <label className="flex items-center gap-1.5 text-sm">
            <input type="number" min={1} max={600} value={minutes} onChange={(e) => setMinutes(Math.min(600, Math.max(1, Number(e.target.value) || 1)))} className="w-16 rounded-control border border-line bg-glass px-2 py-1" />
            min
          </label>
        </div>
      )}
      <div className="flex gap-2">
        {running ? (
          <button onClick={pauseTimer} className={secondary}>
            Pause
          </button>
        ) : timerPausedLeft !== null ? (
          <button onClick={resumeTimer} className={primary}>
            Resume
          </button>
        ) : (
          <button onClick={() => startTimer(minutes * 60_000)} className={primary}>
            Start
          </button>
        )}
        {(running || timerPausedLeft !== null) && (
          <button onClick={cancelTimer} className={secondary}>
            Cancel
          </button>
        )}
      </div>
    </Card>
  );
}

function Stopwatch() {
  const { stopwatchStart, stopwatchBanked, laps, toggleStopwatch, lap, resetStopwatch } = useClockStore();
  const now = useNow(50);
  const elapsed = stopwatchBanked + (stopwatchStart ? now - stopwatchStart : 0);
  return (
    <Card className="flex flex-col items-center gap-5 py-8">
      <p className="font-display text-6xl font-semibold tabular-nums">{formatDuration(elapsed, true)}</p>
      <div className="flex gap-2">
        <button onClick={toggleStopwatch} className={primary}>
          {stopwatchStart ? "Stop" : elapsed ? "Resume" : "Start"}
        </button>
        <button onClick={stopwatchStart ? lap : resetStopwatch} disabled={!elapsed} className={secondary}>
          {stopwatchStart ? "Lap" : "Reset"}
        </button>
      </div>
      {laps.length > 0 && (
        <ol className="w-full max-w-xs divide-y divide-line text-sm tabular-nums">
          {laps.map((t, i) => (
            <li key={laps.length - i} className="flex justify-between py-1.5">
              <span className="text-muted">Lap {laps.length - i}</span>
              {formatDuration(t, true)}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function Alarm() {
  const { alarm, setAlarm } = useClockStore();
  const [value, setValue] = useState(alarm ?? "07:30");
  return (
    <Card className="flex flex-col items-center gap-4 py-8">
      <input type="time" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Alarm time" className="rounded-control border border-line bg-glass px-3 py-2 font-display text-3xl tabular-nums" />
      <div className="flex gap-2">
        <button onClick={() => setAlarm(value)} className={primary}>
          {alarm ? "Update alarm" : "Set alarm"}
        </button>
        {alarm && (
          <button onClick={() => setAlarm(null)} className={secondary}>
            Turn off
          </button>
        )}
      </div>
      <p className="text-sm text-muted">{alarm ? `Alarm set for ${alarm}.` : "No alarm set."} It rings while this tab is open, with sound if Sound is on.</p>
    </Card>
  );
}

// F23: world clock, timer, stopwatch and an in-tab alarm.
export default function Clock() {
  const [tab, setTab] = useState<Tab>("world");
  useEffect(ensureClockTicking, []);
  return (
    <Page>
      <div role="tablist" aria-label="Clock" className="flex rounded-control border border-line bg-glass p-1 text-sm font-medium">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`flex-1 rounded-[8px] py-1.5 ${tab === t.id ? "bg-surface shadow-1" : "text-muted"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "world" && <World />}
      {tab === "timer" && <Timer />}
      {tab === "stopwatch" && <Stopwatch />}
      {tab === "alarm" && <Alarm />}
    </Page>
  );
}
