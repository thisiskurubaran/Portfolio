import type { AppId } from "@/os/apps/registry";
import { usePreferences } from "@/os/state/preferences";
import { useWindows } from "@/os/state/windows";
import { launch } from "@/os/system/launcher";
import { leaveTo } from "@/os/system/navigate";
import { useShortcutsSheet } from "@/os/system/shortcuts";
import type { MenuItem } from "@/shells/shared/Menu";
import { snapRect, type SnapKind } from "./snap";
import { useDesk } from "./state";

const REPO = "https://github.com/thisiskurubaran/Portfolio";

const focused = () => {
  const { windows, focusedId } = useWindows.getState();
  return windows.find((w) => w.id === focusedId && !w.minimized) ?? null;
};

const snapFocused = (kind: SnapKind) => {
  const w = focused();
  if (w) useWindows.getState().setRect(w.id, snapRect(kind));
};

const overlay = (o: Parameters<ReturnType<typeof useDesk.getState>["setOverlay"]>[0]) => () => useDesk.getState().setOverlay(o);

export function desktopMenu(): MenuItem[] {
  return [
    { label: "New sticky note", icon: "sticky", onSelect: overlay("sticky") },
    { label: "All apps", icon: "launcher", shortcut: "F4", onSelect: overlay("launcher") },
    { label: "Open windows", icon: "windows", shortcut: "F3", onSelect: overlay("overview") },
    { separator: true },
    { label: "Change wallpaper", icon: "photos", onSelect: () => launch("settings", "settings-appearance") },
    { label: "Open plain view", icon: "notes", onSelect: () => leaveTo("/plain") },
  ];
}

export function dockMenu(id: AppId, name: string): MenuItem[] {
  const win = useWindows.getState().windows.find((w) => w.appId === id);
  const { open, minimize, close } = useWindows.getState();
  return [
    { label: win ? `Show ${name}` : `Open ${name}`, onSelect: () => open(id) },
    ...(win
      ? ([
          { label: "Minimise", icon: "minimize", onSelect: () => minimize(win.id) },
          { separator: true },
          { label: "Close", icon: "close", danger: true, onSelect: () => close(win.id) },
        ] satisfies MenuItem[])
      : []),
  ];
}

// The menu bar's own menus. They act on the focused window where that applies.
export function menuBarMenus(): { label: string; items: () => MenuItem[] }[] {
  return [
    {
      label: "File",
      items: () => [
        { label: "New sticky note", icon: "sticky", onSelect: overlay("sticky") },
        { label: "Search", icon: "search", shortcut: "Ctrl Space", onSelect: overlay("spotlight") },
        { separator: true },
        { label: "Close window", icon: "close", disabled: !focused(), onSelect: () => focused() && useWindows.getState().close(focused()!.id) },
      ],
    },
    {
      label: "View",
      items: () => {
        const theme = usePreferences.getState().theme;
        const set = usePreferences.getState().setTheme;
        return [
          { label: "All apps", icon: "launcher", shortcut: "F4", onSelect: overlay("launcher") },
          { label: "Open windows", icon: "windows", shortcut: "F3", onSelect: overlay("overview") },
          { label: "Notification center", icon: "bell", onSelect: overlay("center") },
          { separator: true },
          { label: `Light theme${theme === "light" ? " (on)" : ""}`, icon: "sun", onSelect: () => set("light") },
          { label: `Dark theme${theme === "dark" ? " (on)" : ""}`, icon: "moon", onSelect: () => set("dark") },
          { label: `Follow system${theme === "system" ? " (on)" : ""}`, onSelect: () => set("system") },
        ];
      },
    },
    {
      label: "Window",
      items: () => {
        const w = focused();
        const { minimize, toggleMaximize, windows, close } = useWindows.getState();
        return [
          { label: "Minimise", icon: "minimize", disabled: !w, onSelect: () => w && minimize(w.id) },
          { label: w?.maximized ? "Restore" : "Maximise", icon: "maximize", disabled: !w, onSelect: () => w && toggleMaximize(w.id) },
          { separator: true },
          { label: "Snap left", disabled: !w, onSelect: () => snapFocused("left") },
          { label: "Snap right", disabled: !w, onSelect: () => snapFocused("right") },
          { label: "Fill screen", disabled: !w, onSelect: () => snapFocused("fill") },
          { separator: true },
          { label: "Close all windows", danger: true, disabled: windows.length === 0, onSelect: () => windows.forEach((x) => close(x.id)) },
        ];
      },
    },
    {
      label: "Help",
      items: () => [
        { label: "Keyboard shortcuts", icon: "keyboard", shortcut: "Ctrl /", onSelect: () => useShortcutsSheet.getState().setOpen(true) },
        { label: "About folioOS", icon: "info", onSelect: () => launch("sysinfo") },
        { separator: true },
        { label: "Plain view", icon: "notes", onSelect: () => leaveTo("/plain") },
        { label: "Privacy", icon: "lock", onSelect: () => leaveTo("/privacy") },
        { label: "Source code", icon: "browser", onSelect: () => window.open(REPO, "_blank", "noopener,noreferrer") },
      ],
    },
  ];
}
