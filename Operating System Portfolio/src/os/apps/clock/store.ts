import { create } from "zustand";
import { useNotifications } from "@/os/state/notifications";
import { play } from "@/os/system/sound";

interface ClockStore {
  timerEnd: number | null;
  timerPausedLeft: number | null;
  alarm: string | null;
  stopwatchStart: number | null;
  stopwatchBanked: number;
  laps: number[];
  startTimer: (ms: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  cancelTimer: () => void;
  setAlarm: (hhmm: string | null) => void;
  toggleStopwatch: () => void;
  lap: () => void;
  resetStopwatch: () => void;
}

// Timers and alarms live outside the app window, so closing Clock does not
// cancel them. They only fire while the tab is open, and the app says so.
export const useClockStore = create<ClockStore>((set, get) => ({
  timerEnd: null,
  timerPausedLeft: null,
  alarm: null,
  stopwatchStart: null,
  stopwatchBanked: 0,
  laps: [],
  startTimer: (ms) => set({ timerEnd: Date.now() + ms, timerPausedLeft: null }),
  pauseTimer: () => {
    const { timerEnd } = get();
    if (timerEnd) set({ timerEnd: null, timerPausedLeft: Math.max(0, timerEnd - Date.now()) });
  },
  resumeTimer: () => {
    const left = get().timerPausedLeft;
    if (left) set({ timerEnd: Date.now() + left, timerPausedLeft: null });
  },
  cancelTimer: () => set({ timerEnd: null, timerPausedLeft: null }),
  setAlarm: (alarm) => set({ alarm }),
  toggleStopwatch: () => {
    const { stopwatchStart, stopwatchBanked } = get();
    if (stopwatchStart) set({ stopwatchStart: null, stopwatchBanked: stopwatchBanked + Date.now() - stopwatchStart });
    else set({ stopwatchStart: Date.now() });
  },
  lap: () => set((s) => ({ laps: [s.stopwatchBanked + (s.stopwatchStart ? Date.now() - s.stopwatchStart : 0), ...s.laps].slice(0, 20) })),
  resetStopwatch: () => set({ stopwatchStart: null, stopwatchBanked: 0, laps: [] }),
}));

let ticking = false;

// One shared check every half second fires finished timers and due alarms.
export function ensureClockTicking() {
  if (ticking || typeof window === "undefined") return;
  ticking = true;
  window.setInterval(() => {
    const s = useClockStore.getState();
    const now = new Date();
    if (s.timerEnd && Date.now() >= s.timerEnd) {
      useClockStore.setState({ timerEnd: null });
      play("alarm");
      useNotifications.getState().push("Timer finished", { body: "Your Clock timer is done.", action: { label: "Open Clock", app: "clock" } });
    }
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (s.alarm && s.alarm === hhmm) {
      useClockStore.setState({ alarm: null });
      play("alarm");
      useNotifications.getState().push("Alarm", { body: `It is ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`, action: { label: "Open Clock", app: "clock" } });
    }
  }, 500);
}

export const formatDuration = (ms: number, centis = false) => {
  const total = Math.max(0, ms);
  const h = Math.floor(total / 3_600_000);
  const m = Math.floor((total % 3_600_000) / 60_000);
  const s = Math.floor((total % 60_000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  const base = `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(s).padStart(2, "0")}`;
  return centis ? `${base}.${String(cs).padStart(2, "0")}` : base;
};
