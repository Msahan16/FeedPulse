import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FeedPulse",
  description: "AI-powered product feedback platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
