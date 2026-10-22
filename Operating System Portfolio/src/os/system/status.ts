"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// The Battery and Network Information APIs are Chromium only and missing
// from the DOM types. Both are best effort: when absent the UI shows nothing.
interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
}
interface NetworkInformation extends EventTarget {
  effectiveType?: string;
  saveData?: boolean;
}
type NavigatorExtras = Navigator & {
  getBattery?: () => Promise<BatteryManager>;
  connection?: NetworkInformation;
};

export interface BatteryState {
  level: number;
  charging: boolean;
}

export function useBattery(): BatteryState | null {
  const [battery, setBattery] = useState<BatteryState | null>(null);
  useEffect(() => {
    const nav = navigator as NavigatorExtras;
    if (!nav.getBattery) return;
    let manager: BatteryManager | null = null;
    const update = () => manager && setBattery({ level: manager.level, charging: manager.charging });
    nav
      .getBattery()
      .then((m) => {
        manager = m;
        update();
        m.addEventListener("levelchange", update);
        m.addEventListener("chargingchange", update);
      })
      .catch(() => setBattery(null));
    return () => {
      manager?.removeEventListener("levelchange", update);
      manager?.removeEventListener("chargingchange", update);
    };
  }, []);
  return battery;
}

export interface NetworkState {
  online: boolean;
  type: string | null;
  saveData: boolean;
}

function readNetwork(): NetworkState {
  const c = (navigator as NavigatorExtras).connection;
  return { online: navigator.onLine, type: c?.effectiveType ?? null, saveData: c?.saveData ?? false };
}

let cached: NetworkState | null = null;
function snapshot() {
  const next = readNetwork();
  if (!cached || cached.online !== next.online || cached.type !== next.type || cached.saveData !== next.saveData) cached = next;
  return cached;
}

function subscribe(cb: () => void) {
  const c = (navigator as NavigatorExtras).connection;
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  c?.addEventListener("change", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
    c?.removeEventListener("change", cb);
  };
}

const SERVER: NetworkState = { online: true, type: null, saveData: false };

export function useNetwork(): NetworkState {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER);
}
