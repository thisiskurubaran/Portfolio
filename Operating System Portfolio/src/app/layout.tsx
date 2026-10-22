import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kurubaran Anandhan",
  description: "Senior full-stack engineer. Portfolio shown as an operating system.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
