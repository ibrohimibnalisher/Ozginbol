import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ozginbol: kaloriya kalkulyatori",
  description:
    "Nima yeganingizni yozing, kaloriya, oqsil, yog' va uglevodni darrov bilib oling. Osh, somsa, lag'mon va boshqa o'zbek taomlari bazasi, kunlik me'yor va yog' foizi kalkulyatori.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06180f",
};

// Applies the saved theme before first paint, so there is no flash.
const themeScript = `try{var t=localStorage.getItem("ozginbol.theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
