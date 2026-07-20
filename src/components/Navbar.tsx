"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/music", label: "Musique" },
  { href: "/sessions", label: "Sessions" },
  { href: "/artists", label: "Artistes" },
  { href: "/events", label: "Événements" },
  { href: "/about", label: "À propos" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        UNCOMMON
        <br />
        RECORDS
      </Link>
      <div className="navbar-nav">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname === l.href ? "active" : ""}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <Link href="/login" className="btn btn-outline" style={{ padding: "0.5rem 1.1rem" }}>
        Espace pro
      </Link>

      <style jsx>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          height: var(--navbar-height);
          display: flex;
          align-items: center;
          gap: 2rem;
          padding-inline: clamp(1rem, 3vw, 3rem);
          background: rgba(4, 4, 4, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--color-border);
        }
        .navbar-logo {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 0.75rem;
          line-height: 1;
          letter-spacing: 0.05em;
        }
        .navbar-nav {
          display: flex;
          gap: 1.5rem;
          margin-left: auto;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .navbar-nav :global(a) {
          color: var(--color-text-muted);
          transition: color 0.15s ease;
        }
        .navbar-nav :global(a:hover),
        .navbar-nav :global(a.active) {
          color: var(--color-text);
        }
        @media (max-width: 768px) {
          .navbar-nav {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
}
