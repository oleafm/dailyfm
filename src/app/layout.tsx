import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "to.daily — Grow every day",
  description:
    "A quiet place to see your progress. Meaningful work and a life well lived.",
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
