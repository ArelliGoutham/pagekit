import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PageKit",
  description: "Open-source documentation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}