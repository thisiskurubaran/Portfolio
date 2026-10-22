import type { MetadataRoute } from "next";

// F33: installs folioOS as an app with its own window and icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "folioOS: Kurubaran Anandhan",
    short_name: "folioOS",
    description: "Kurubaran Anandhan's portfolio, built as an operating system.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0e12",
    theme_color: "#0b0e12",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
