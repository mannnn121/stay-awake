import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stay Awake",
  description:
    "Score an eye image as awake or not awake with the StayAwake CNN.",
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
