import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <div className="hero-inner container">
        <div className="badge">Rennes · Founded in 2022</div>
        <h1 className="hero-wordmark">
          UNCOMMON
          <span>RECORDS</span>
        </h1>
        <div className="hero-tag">Electronic Music Label</div>
        <p className="hero-desc text-muted">
          Uncommon Records construit un univers où l&apos;Afro House, la House et la
          Tech House deviennent des expériences complètes : releases fortes,
          scénographies marquantes et événements à taille émotionnelle.
        </p>
        <div className="hero-actions">
          <Link href="/music" className="btn btn-primary btn-lg">
            Découvrir les releases
          </Link>
          <Link href="/events" className="btn btn-outline btn-lg">
            Voir les shows
          </Link>
        </div>
      </div>

      <style>{`
        .hero { min-height: calc(100vh - var(--navbar-height)); display: flex; align-items: center; }
        .hero-inner { display: flex; flex-direction: column; gap: 1.5rem; max-width: 760px; }
        .hero-wordmark {
          font-size: clamp(3rem, 12vw, 9rem); font-weight: 800; letter-spacing: -0.05em; line-height: 0.85;
        }
        .hero-wordmark span {
          display: block; color: transparent; -webkit-text-stroke: 1px var(--color-gold);
        }
        .hero-tag {
          font-size: 0.8rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-gold);
        }
        .hero-desc { font-size: 1.05rem; max-width: 520px; }
        .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem; }
      `}</style>
    </section>
  );
}
