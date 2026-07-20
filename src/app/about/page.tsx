import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container section" style={{ maxWidth: 860 }}>
      <div className="badge">Le label</div>
      <h1 className="display-lg" style={{ margin: "1rem 0 1.5rem" }}>
        À propos
      </h1>
      <p className="text-muted" style={{ fontSize: "1.1rem", lineHeight: 1.8 }}>
        Uncommon Records est un label de musique électronique fondé à Rennes en 2022.
        Entre Afro House, House et Tech House, le label construit un univers où la musique,
        la scénographie et l&apos;image forment une expérience cohérente.
      </p>
      <p className="text-muted" style={{ fontSize: "1.05rem", lineHeight: 1.8, marginTop: "1.5rem" }}>
        De ses releases à ses événements, Uncommon défend une direction artistique forte :
        des sons chauds et organiques, des lineups soignés, et des shows pensés comme des moments.
      </p>

      <div style={{ display: "flex", gap: "1rem", marginTop: "2.5rem", flexWrap: "wrap" }}>
        <Link href="/music" className="btn btn-primary">
          Écouter les releases
        </Link>
        <Link href="/events" className="btn btn-outline">
          Voir les événements
        </Link>
        <a
          href="https://www.instagram.com/weareuncommonrecords/"
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline"
        >
          Instagram
        </a>
      </div>
    </div>
  );
}
