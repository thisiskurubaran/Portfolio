import { z } from "zod";
import { stickyColors } from "./limits";

export { MAX_NOTE } from "./limits";

// Shared by the API routes (to validate) and the apps (for types).
export const guestbookInput = z.object({
  name: z.string().max(40).optional(),
  message: z.string().min(1).max(400),
});

export const guestbookEntry = z.object({
  id: z.string(),
  name: z.string().nullable(),
  message: z.string(),
  at: z.number(),
});
export type GuestbookEntry = z.infer<typeof guestbookEntry>;

export const stickyInput = z.object({
  text: z.string().min(1).max(400),
  color: z.enum(stickyColors),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const stickyNote = stickyInput.extend({ id: z.string(), at: z.number() });
export type StickyNote = z.infer<typeof stickyNote>;

export const contactInput = z.object({
  name: z.string().max(80).optional(),
  email: z.email().max(200),
  message: z.string().min(10).max(4000),
  // Hidden from people; bots fill every field.
  website: z.string().max(0).optional(),
});
