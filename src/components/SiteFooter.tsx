import Link from "next/link";
import Newsletter from "@/components/Newsletter";

const nav = [
  { href: "/music", label: "Musique" },
  { href: "/artists", label: "Artistes" },
  { href: "/events", label: "Événements" },
  { href: "/sessions", label: "Sessions" },
  { href: "/about", label: "À propos" },
];

export default function SiteFooter() {
  return (
    <footer className="foot">
      <div className="container foot-grid">
        <div className="foot-brand">
          <div className="eyebrow">Rennes · Est. 2022</div>
          <h2 className="foot-word">UNCOMMON RECORDS</h2>
          <p className="text-muted" style={{ maxWidth: "34ch", marginTop: "0.75rem" }}>
            Label de musique électronique — Afro House, House &amp; Tech House.
          </p>
        </div>

        <div className="foot-col">
          <div className="foot-h">Navigation</div>
          {nav.map((l) => (
            <Link key={l.href} href={l.href} className="foot-link">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="foot-col foot-news">
          <div className="foot-h">Newsletter</div>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>
            Releases, shows et annonces du label.
          </p>
          <Newsletter />
          <div className="foot-social">
            <a href="https://www.instagram.com/weareuncommonrecords/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://soundcloud.com/" target="_blank" rel="noreferrer">SoundCloud</a>
            <a href="https://www.beatport.com/" target="_blank" rel="noreferrer">Beatport</a>
          </div>
        </div>
      </div>

      <div className="container foot-bottom">
        <span>© {new Date().getFullYear()} Uncommon Records</span>
        <span>Rennes, France</span>
      </div>
    </footer>
  );
}
