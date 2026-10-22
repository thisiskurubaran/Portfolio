import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

// Self-hosted at build time, so the font comes from our own origin.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Kurubaran Anandhan",
  description: "Senior full-stack engineer. Portfolio shown as an operating system.",
};

export const viewport: Viewport = {
  themeColor: "#0e1116",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Render per request so Next.js can stamp each response with the CSP nonce
  // from src/proxy.ts. A page built ahead of time would carry no nonce and its
  // scripts would be blocked.
  await connection();
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <a href="/plain" className="skip-link">
          Skip to plain view
        </a>
        {children}
      </body>
    </html>
  );
}
