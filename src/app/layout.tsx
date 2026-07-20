import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Newsletter from "@/components/Newsletter";

export const metadata: Metadata = {
  title: "Uncommon Records — Electronic Music Label · Rennes",
  description:
    "Label de musique électronique fondé à Rennes en 2022. Afro House · House · Tech House. Releases, shows et univers visuel Uncommon Records.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        <main>{children}</main>
        <footer
          className="container"
          style={{ padding: "3rem 0", borderTop: "1px solid var(--color-border)", marginTop: "4rem" }}
        >
          <h3 style={{ fontSize: "1.1rem" }}>Newsletter</h3>
          <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
            Releases, shows et annonces du label.
          </p>
          <Newsletter />
          <p style={{ color: "var(--color-text-faint)", fontSize: "0.8rem", marginTop: "2rem" }}>
            © {new Date().getFullYear()} Uncommon Records — Rennes
          </p>
        </footer>
      </body>
    </html>
  );
}
