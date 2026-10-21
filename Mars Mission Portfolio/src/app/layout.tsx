import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { ui } from "@/content/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: ui.siteTitle,
  description: ui.siteDescription,
};

export const viewport: Viewport = {
  themeColor: "#000000",
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
