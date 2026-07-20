"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import type { Track } from "@/lib/types";

export default function MusicPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ tracks: Track[] }>("/tracks")
      .then((d) => setTracks(d.tracks))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container section">
      <header className="page-head">
        <span className="badge">Catalogue</span>
        <h1 className="section-title">Releases</h1>
        <p className="lead">Les sorties du label, entre Afro House, House et Tech House.</p>
      </header>

      {loading ? (
        <div className="grid-cards">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card"><div className="cover" style={{ opacity: 0.4 }} /><div style={{ padding: "1rem", height: 78 }} /></div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="empty">
          <span className="empty-mark">♪</span>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>Aucune release publiée pour le moment.</p>
          <p style={{ fontSize: "0.9rem" }}>Les nouvelles sorties apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {tracks.map((t) => (
            <article key={t.id} className="card rise">
              <div className="cover" style={t.cover_url ? { backgroundImage: `url(${t.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                {t.genre && <span className="cover-genre">{t.genre}</span>}
              </div>
              <div className="track-body">
                <h3 className="track-title">{t.title}</h3>
                <p className="text-muted track-artist">{t.artist?.name}</p>
                {t.preview_url && <audio controls src={t.preview_url} className="track-audio" preload="none" />}
                <div className="track-links">
                  {t.spotify_url && <a href={t.spotify_url} target="_blank" rel="noreferrer" className="chip">Spotify</a>}
                  {t.beatport_url && <a href={t.beatport_url} target="_blank" rel="noreferrer" className="chip">Beatport</a>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <style>{`
        .cover-genre { position: absolute; top: 0.75rem; left: 0.75rem; z-index: 1; padding: 0.25rem 0.6rem; border-radius: 999px; background: rgba(6,5,5,0.66); backdrop-filter: blur(6px); border: 1px solid var(--gold-line); color: var(--gold-2); font-size: 0.66rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        .track-body { padding: 1.1rem 1.15rem 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .track-title { font-size: 1.15rem; letter-spacing: -0.01em; }
        .track-artist { font-size: 0.85rem; }
        .track-audio { width: 100%; height: 34px; margin-top: 0.35rem; }
        .track-links { display: flex; gap: 0.4rem; margin-top: 0.4rem; }
      `}</style>
    </div>
  );
}
