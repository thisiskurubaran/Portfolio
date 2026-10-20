import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lighthouse",
  description: "A developer portfolio you play. Turn the beam, find the ships.",
};

export const viewport: Viewport = {
  themeColor: "#05080f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
