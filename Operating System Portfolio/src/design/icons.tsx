import type { SVGProps } from "react";

// Original 24x24 line icons drawn for kbOS. Stroke only, so they inherit
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
  logo: "M5 4v16M5 12l7-8M5 12l7 8M15 7.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 0 1 0-9z",
} as const;

export type IconName = keyof typeof paths;
export const iconNames = Object.keys(paths) as IconName[];

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 24, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={rest["aria-label"] ? undefined : true}
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
