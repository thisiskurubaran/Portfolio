import { create } from "zustand";

// F21: every keyboard shortcut in one place, for the sheet and the docs.
export const shortcutGroups: { title: string; items: [string, string][] }[] = [
  {
    title: "Everywhere",
    items: [
      ["Ctrl Space or Ctrl K", "Search apps and content"],
      ["Ctrl /", "Show keyboard shortcuts"],
      ["Escape", "Close the current window, sheet or menu"],
      ["Tab", "Move between controls"],
    ],
  },
  {
    title: "folioDesk",
    items: [
      ["F4", "All apps"],
      ["F3 or Ctrl Up", "Open windows"],
      ["Alt 1, 2, 3", "Switch desktop"],
      ["Ctrl Alt Left or Right", "Snap the window to a half"],
      ["Ctrl Alt Up", "Fill the screen"],
      ["Ctrl Alt Down", "Restore the window"],
      ["Arrow keys", "Move along the dock and grids"],
    ],
  },
  {
    title: "Apps",
    items: [
      ["Up and Down", "Terminal history"],
      ["Tab", "Terminal completion"],
      ["Arrow keys", "Move between folioVision panels"],
      ["Up Up Down Down Left Right Left Right B A", "Something hidden"],
    ],
  },
];

export const useShortcutsSheet = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
