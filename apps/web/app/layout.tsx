import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ozginbol: kaloriya kalkulyatori",
  description:
    "Nima yeganingizni yozing, kaloriya, oqsil, yog' va uglevodni darrov bilib oling. Osh, somsa, lag'mon va boshqa o'zbek taomlari bazasi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#101410" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
