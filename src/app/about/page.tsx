import Link from "next/link";

const values = [
  { k: "Direction artistique", v: "Des sons chauds et organiques, une identité visuelle cohérente." },
  { k: "Shows", v: "Des événements pensés comme des moments, scénographie soignée." },
  { k: "Roster", v: "Des artistes signés et accompagnés sur la durée." },
];

export default function AboutPage() {
  return (
    <div className="container section">
      <header className="page-head">
        <span className="badge">Le label</span>
        <h1 className="section-title">À propos</h1>
      </header>

      <div className="about-grid">
        <div className="about-lede">
          <p className="lead" style={{ fontSize: "clamp(1.15rem, 1.8vw, 1.5rem)", color: "var(--text)", maxWidth: "30ch" }}>
            Uncommon Records est un label de musique électronique fondé à Rennes en 2022.
          </p>
        </div>
        <div className="about-body">
          <p className="text-muted" style={{ fontSize: "1.05rem", lineHeight: 1.8 }}>
            Entre Afro House, House et Tech House, le label construit un univers où la
            musique, la scénographie et l&apos;image forment une expérience cohérente.
            De ses releases à ses événements, Uncommon défend une direction artistique
            forte : des lineups soignés et des shows pensés comme des moments.
          </p>

          <div className="about-values">
            {values.map((it) => (
              <div key={it.k} className="about-value">
                <div className="text-gold" style={{ fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{it.k}</div>
                <p className="text-muted" style={{ fontSize: "0.95rem", marginTop: "0.4rem" }}>{it.v}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem", flexWrap: "wrap" }}>
            <Link href="/music" className="btn btn-primary">Écouter les releases</Link>
            <Link href="/events" className="btn btn-outline">Voir les événements</Link>
          </div>
        </div>
      </div>

      <style>{`
        .about-grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: clamp(2rem, 6vw, 5rem); }
        .about-lede { border-left: 2px solid var(--gold-line); padding-left: 1.5rem; }
        .about-values { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid var(--line); }
        @media (max-width: 820px) { .about-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
