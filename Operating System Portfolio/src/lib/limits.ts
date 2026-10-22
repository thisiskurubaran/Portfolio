// Kept apart from the zod schemas so client code can import it without zod.
export const MAX_NOTE = 140;
export const stickyColors = ["yellow", "mint", "rose", "sky"] as const;
export type StickyColor = (typeof stickyColors)[number];
