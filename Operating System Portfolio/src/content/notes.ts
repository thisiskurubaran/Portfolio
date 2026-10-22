export interface Note {
  slug: string;
  title: string;
  date: string;
  summary: string;
}

// Notes move to MDX files under src/content/notes/ once there is writing to show.
export const notes: Note[] = [];
