/**
 * The failures archive (F17): abandoned and failed projects, shown as
 * derelict craft. Each entry says what went wrong and what was learned.
 *
 * Empty on purpose. Only the owner can say which projects failed and why,
 * and nothing here may be invented. Add entries and they appear as wrecks
 * on the surface and in the mission file.
 */
export type DebrisEntry = {
  id: string;
  name: string;
  summary: string;
  wentWrong: string;
  learned: string;
  years?: string;
};

export const debris: readonly DebrisEntry[] = [];
