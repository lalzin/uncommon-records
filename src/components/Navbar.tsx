"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
      <div className="nav-inner container">
        <Link href="/" className="brand" aria-label="Uncommon Records">
          <span className="brand-mark">UR</span>
          <span className="brand-word">
            UNCOMMON<br />RECORDS
          </span>
        </Link>

        <nav className="nav-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>

        <Link href="/login" className="btn btn-outline btn-sm nav-cta">
          Espace pro
        </Link>

        <button className="nav-burger" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          <span className={open ? "x" : ""} />
          <span className={open ? "x" : ""} />
        </button>
      </div>

      {open && (
        <nav className="nav-mobile">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="btn btn-outline" style={{ marginTop: "0.5rem" }}>
            Espace pro
          </Link>
        </nav>
      )}

      <style jsx>{`
        .nav { position: sticky; top: 0; z-index: 100; transition: background 0.3s var(--ease), border-color 0.3s var(--ease); border-bottom: 1px solid transparent; }
        .nav-scrolled { background: rgba(6, 5, 5, 0.72); backdrop-filter: blur(18px) saturate(1.2); border-bottom-color: var(--line); }
        .nav-inner { height: var(--nav-h); display: flex; align-items: center; gap: 2rem; }
        .brand { display: inline-flex; align-items: center; gap: 0.7rem; }
        .brand-mark {
          width: 40px; height: 40px; display: grid; place-items: center; flex-shrink: 0;
          font-family: var(--font-display); font-weight: 800; font-size: 0.9rem; letter-spacing: -0.03em;
          color: #1a1206; background: linear-gradient(180deg, var(--gold-2), var(--gold)); border-radius: 10px;
        }
        .brand-word { font-family: var(--font-display); font-weight: 800; font-size: 0.7rem; line-height: 1.05; letter-spacing: 0.06em; color: var(--text); }
        .nav-links { display: flex; gap: 1.75rem; margin-left: auto; font-size: 0.86rem; font-weight: 500; }
        .nav-links :global(a) { position: relative; color: var(--muted); padding-block: 0.4rem; transition: color 0.2s var(--ease); }
        .nav-links :global(a::after) { content: ""; position: absolute; left: 0; bottom: 0; height: 1.5px; width: 0; background: var(--gold); transition: width 0.3s var(--ease); }
        .nav-links :global(a:hover) { color: var(--text); }
        .nav-links :global(a.active) { color: var(--text); }
        .nav-links :global(a.active::after) { width: 100%; }
        .nav-cta { flex-shrink: 0; }
        .nav-burger { display: none; flex-direction: column; gap: 6px; width: 34px; height: 34px; align-items: center; justify-content: center; }
        .nav-burger span { width: 22px; height: 2px; background: var(--text); border-radius: 2px; transition: transform 0.3s var(--ease); }
        .nav-burger span.x:first-child { transform: translateY(4px) rotate(45deg); }
        .nav-burger span.x:last-child { transform: translateY(-4px) rotate(-45deg); }
        .nav-mobile { display: flex; flex-direction: column; gap: 0.25rem; padding: 1rem clamp(1.25rem, 4vw, 3.5rem) 1.5rem; background: rgba(6,5,5,0.96); backdrop-filter: blur(18px); border-bottom: 1px solid var(--line); }
        .nav-mobile :global(a) { padding: 0.7rem 0; color: var(--muted); font-size: 1rem; font-weight: 500; }
        .nav-mobile :global(a.active) { color: var(--gold); }
        @media (max-width: 860px) {
          .nav-links, .nav-cta { display: none; }
          .nav-burger { display: flex; }
          .nav-scrolled { background: rgba(6,5,5,0.9); }
          .nav { background: rgba(6,5,5,0.6); backdrop-filter: blur(12px); }
        }
      `}</style>
    </header>
  );
}
