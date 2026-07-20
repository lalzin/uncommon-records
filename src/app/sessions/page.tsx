"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

interface SessionItem {
  id: number;
  title: string;
  description: string | null;
  embed_url: string;
  is_featured: boolean;
}

function SessionCard({ item, featured }: { item: SessionItem; featured?: boolean }) {
  return (
    <article className="card rise ses" style={featured ? { gridColumn: "1 / -1" } : undefined}>
      <div className="ses-frame">
        <iframe
          src={item.embed_url}
          title={item.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div className="ses-body">
        <span className="eyebrow">{featured ? "Session mise en avant" : "Session vidéo"}</span>
        <h2 className="ses-title">{item.title}</h2>
        <p className="text-muted" style={{ fontSize: "0.92rem" }}>
          {item.description || "Session vidéo Uncommon Records."}
        </p>
      </div>
    </article>
  );
}

export default function SessionsPage() {
  const [items, setItems] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ sessions: SessionItem[] }>("/sessions")
      .then((d) => setItems(d.sessions))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const featured = items.find((i) => i.is_featured) || items[0];
  const rest = featured ? items.filter((i) => i.id !== featured.id) : [];

  return (
    <div className="container section">
      <header className="page-head">
        <span className="badge">Vidéos</span>
        <h1 className="section-title">Sessions</h1>
        <p className="lead">Sets et captations vidéo dans l&apos;esthétique du label.</p>
      </header>

      {loading ? (
        <p className="text-muted">Chargement…</p>
      ) : items.length === 0 ? (
        <div className="empty">
          <span className="empty-mark">▶</span>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>Aucune session publiée pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="ses-grid">
          {featured && <SessionCard item={featured} featured />}
          {rest.map((i) => (
            <SessionCard key={i.id} item={i} />
          ))}
        </div>
      )}

      <style>{`
        .ses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: clamp(1rem, 2vw, 1.75rem); }
        .ses-frame { position: relative; aspect-ratio: 16 / 9; }
        .ses-frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
        .ses-body { padding: 1.25rem 1.35rem 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .ses-title { font-size: 1.35rem; letter-spacing: -0.02em; }
      `}</style>
    </div>
  );
}
