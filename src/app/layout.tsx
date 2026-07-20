import type { Metadata } from "next";
import { Syne, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

// Self-hosted via next/font — no external @import (CSP-safe, always loads).
const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Uncommon Records — Electronic Music Label · Rennes",
  description:
    "Label de musique électronique fondé à Rennes en 2022. Afro House · House · Tech House. Releases, shows et univers visuel Uncommon Records.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="grain" aria-hidden />
        <div className="bg-glow" aria-hidden />
        <Navbar />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
