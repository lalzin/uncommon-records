"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import type { Artist } from "@/lib/types";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ artists: Artist[] }>("/artists")
      .then((d) => setArtists(d.artists))
      .catch(() => setArtists([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container section">
      <header className="page-head">
        <span className="badge">Roster</span>
        <h1 className="section-title">Artistes</h1>
        <p className="lead">Les signatures du label et leurs univers.</p>
      </header>

      {loading ? (
        <p className="text-muted">Chargement…</p>
      ) : artists.length === 0 ? (
        <div className="empty">
          <span className="empty-mark">✦</span>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>Le roster arrive bientôt.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {artists.map((a) => (
            <article key={a.id} className="card rise art">
              <div className="art-avatar" style={a.avatar ? { backgroundImage: `url(${a.avatar})` } : undefined}>
                {!a.avatar && <span>{a.name.charAt(0)}</span>}
              </div>
              <h3 className="art-name">{a.name}</h3>
              {a.bio && <p className="text-muted art-bio">{a.bio}</p>}
              <span className="art-count">{a.track_count ?? 0} release{(a.track_count ?? 0) > 1 ? "s" : ""}</span>
            </article>
          ))}
        </div>
      )}

      <style>{`
        .art { padding: 1.75rem 1.5rem 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
        .art-avatar { width: 104px; height: 104px; border-radius: 50%; margin-bottom: 0.75rem; background: linear-gradient(135deg, var(--surface-3), var(--bg-2)); background-size: cover; background-position: center; display: grid; place-items: center; border: 1px solid var(--gold-line); }
        .art-avatar span { font-family: var(--font-display); font-weight: 800; font-size: 2rem; color: var(--gold); }
        .art-name { font-size: 1.25rem; }
        .art-bio { font-size: 0.86rem; line-height: 1.5; }
        .art-count { margin-top: 0.4rem; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); }
      `}</style>
    </div>
  );
}
