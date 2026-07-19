import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QualiAgent | Explainable QA Risk Analysis",
  description:
    "Turn code changes into explainable QA risks, prioritized regression tests, and human-reviewed release recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
