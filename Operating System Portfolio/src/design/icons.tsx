import type { SVGProps } from "react";

// Original 24x24 line icons drawn for folioOS. Stroke only, so they inherit
// currentColor and work in both themes.
const paths = {
  about: "M12 4a4 4 0 1 1 0 8a4 4 0 0 1 0-8zM4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5",
  experience: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  projects: "M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z",
  skills: "M8 6l-5 6l5 6M16 6l5 6l-5 6M13.5 5l-3 14",
  certifications: "M12 3l2.4 1.8l3-.1l.9 2.9l2.4 1.8l-.9 2.8l.9 2.8l-2.4 1.8l-.9 2.9l-3-.1L12 21l-2.4-1.8l-3 .1l-.9-2.9L3.3 14.6l.9-2.8l-.9-2.8l2.4-1.8l.9-2.9l3 .1z",
  contact: "M4 6h16v12H4zM4 7l8 6l8-6",
  resume: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
  terminal: "M4 5h16v14H4zM7.5 10l3 2.5l-3 2.5M13 15h4",
  settings: "M12 9a3 3 0 1 1 0 6a3 3 0 0 1 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1",
  photos: "M4 5h16v14H4zM4 16l5-5l4 4l3-3l4 4M15 9.5h.01",
  browser: "M12 3a9 9 0 1 1 0 18a9 9 0 0 1 0-18zM3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z",
  notes: "M6 4h12v16H6zM9 9h6M9 13h6M9 17h3",
  guestbook: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6",
  sticky: "M5 5h14v9l-5 5H5zM14 19v-5h5",
  nets: "M12 4a8 8 0 1 1 0 16a8 8 0 0 1 0-16zM7 7.5c2.5 2 2.5 7 0 9M17 7.5c-2.5 2-2.5 7 0 9",
  files: "M3.5 7a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2zM3.5 10h17",
  calendar: "M5 6h14v14H5zM5 10h14M9 4v4M15 4v4M9 14h2M13 14h2M9 17h2",
  clock: "M12 4a8 8 0 1 1 0 16a8 8 0 0 1 0-16zM12 8v4l3 2",
  calculator: "M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 15.5h.01M12 15.5h.01M15 15.5h.01M9 19h.01M12 19h3",
  editor: "M5 4h9l5 5v11H5zM14 4v5h5M8 13h8M8 16.5h5",
  activity: "M3 12h4l2.5-6l4 12l2.5-6H21",
  info: "M12 4a8 8 0 1 1 0 16a8 8 0 0 1 0-16zM12 11v5M12 8h.01",
  launcher: "M5 5h4v4H5zM10 5h4v4h-4zM15 5h4v4h-4zM5 10h4v4H5zM10 10h4v4h-4zM15 10h4v4h-4zM5 15h4v4H5zM10 15h4v4h-4zM15 15h4v4h-4z",
  power: "M12 4v7M7.5 6.5a7 7 0 1 0 9 0",
  lock: "M6.5 11h11v9h-11zM9 11V8a3 3 0 0 1 6 0v3",
  restart: "M5 12a7 7 0 1 0 2.2-5.1M5 4.5v3.5h3.5",
  keyboard: "M3 7h18v10H3zM6.5 10h.01M9.5 10h.01M12.5 10h.01M15.5 10h.01M8 14h8",
  share: "M12 4v11M8 8l4-4l4 4M5 13v6h14v-6",
  search: "M11 4.5a6.5 6.5 0 1 1 0 13a6.5 6.5 0 0 1 0-13zM16 16l4.5 4.5",
  windows: "M3 5h8v6H3zM13 5h8v6h-8zM3 13h8v6H3zM13 13h8v6h-8z",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4",
  moon: "M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z",
  sun: "M12 8.5a3.5 3.5 0 1 1 0 7a3.5 3.5 0 0 1 0-7zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4",
  close: "M6 6l12 12M18 6L6 18",
  minimize: "M6 12h12",
  maximize: "M6 6h12v12H6z",
  restore: "M8 8h10v10H8zM6 16V6h10",
  chevron: "M9 6l6 6l-6 6",
  plus: "M12 5v14M5 12h14",
  copy: "M9 9h10v10H9zM5 15V5h10",
  download: "M12 4v11M8 11l4 4l4-4M5 19h14",
} as const;

export type IconName = keyof typeof paths;
export const iconNames = Object.keys(paths) as IconName[];

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  weight?: number;
}

export function Icon({ name, size = 24, weight = 1.6, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={rest["aria-label"] ? undefined : true}
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
