import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lighthouse",
  description: "A developer portfolio you play. Turn the beam, find the ships.",
};

export const viewport: Viewport = {
  themeColor: "#05080f",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Render per request so Next.js can stamp each response with the CSP nonce
  // from src/proxy.ts. A page built ahead of time would carry no nonce and its
  // scripts would be blocked.
  await connection();
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
