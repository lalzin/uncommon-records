import Link from "next/link";

const genres = ["Afro House", "House", "Tech House", "Melodic", "Organic", "Deep"];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-top rise d1">
            <span className="eyebrow">Rennes · Founded in 2022</span>
            <span className="hero-sep" />
            <span className="eyebrow" style={{ color: "var(--muted)", letterSpacing: "0.22em" }}>
              Electronic Music Label
            </span>
          </div>

          <h1 className="wordmark">
            <span className="wm-solid rise d2">UNCOMMON</span>
            <span className="wm-outline rise d3">RECORDS</span>
          </h1>

          <div className="hero-body">
            <p className="lead rise d3">
              Un univers où l&apos;Afro House, la House et la Tech House deviennent des
              expériences complètes — releases fortes, scénographies marquantes et
              événements à taille émotionnelle.
            </p>
            <div className="hero-actions rise d4">
              <Link href="/music" className="btn btn-primary btn-lg">
                Découvrir les releases
              </Link>
              <Link href="/events" className="btn btn-outline btn-lg">
                Voir les shows
              </Link>
            </div>
          </div>
        </div>

        <div className="hero-scroll rise d5">
          <span>Scroll</span>
          <span className="hero-scroll-line" />
        </div>
      </section>

      <div className="marquee">
        <div className="marquee-track">
          {[...genres, ...genres, ...genres].map((g, i) => (
            <span key={i} className="marquee-item">{g}</span>
          ))}
        </div>
      </div>

      <style>{`
        .hero { min-height: calc(100svh - var(--nav-h)); display: flex; flex-direction: column; justify-content: center; position: relative; padding-block: clamp(3rem, 8vh, 7rem); overflow-x: clip; }
        .hero-inner { display: flex; flex-direction: column; gap: clamp(1.5rem, 3vw, 2.5rem); }
        .hero-top { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .hero-sep { width: 34px; height: 1px; background: var(--gold-line); }
        .wordmark { display: flex; flex-direction: column; line-height: 0.9; max-width: 100%; }
        .wm-solid {
          font-family: var(--font-display); font-weight: 800; white-space: nowrap;
          font-size: clamp(2.2rem, 7.4vw, 5.6rem); letter-spacing: -0.04em;
          background: linear-gradient(180deg, #fbf6ec, #cdbfa6);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .wm-outline {
          font-family: var(--font-display); font-weight: 800; white-space: nowrap;
          font-size: clamp(1.85rem, 6.3vw, 4.8rem); letter-spacing: -0.015em;
          color: transparent; -webkit-text-stroke: 1.3px var(--gold-line);
          margin-top: 0.05em;
        }
        .hero-body { display: flex; flex-direction: column; gap: 1.75rem; margin-top: 0.5rem; }
        .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
        .hero-scroll { position: absolute; bottom: clamp(1.5rem, 4vh, 3rem); left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 0.6rem; font-size: 0.68rem; letter-spacing: 0.24em; text-transform: uppercase; color: var(--faint); }
        .hero-scroll-line { width: 1px; height: 42px; background: linear-gradient(var(--gold), transparent); }
        @media (max-width: 860px) { .hero-scroll { display: none; } }
      `}</style>
    </>
  );
}
