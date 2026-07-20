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
      <div className="badge">Catalogue</div>
      <h1 className="display-lg" style={{ margin: "1rem 0 2.5rem" }}>
        Releases
      </h1>

      {loading ? (
        <p className="text-muted">Chargement…</p>
      ) : tracks.length === 0 ? (
        <p className="text-muted">Aucune release pour le moment.</p>
      ) : (
        <div className="grid-auto">
          {tracks.map((t) => (
            <article key={t.id} className="surface" style={{ overflow: "hidden" }}>
              <div
                style={{
                  aspectRatio: "1",
                  background: t.cover_url
                    ? `center/cover url(${t.cover_url})`
                    : "linear-gradient(135deg,#1d1c1b,#0c0b0b)",
                }}
              />
              <div style={{ padding: "1rem" }}>
                <h3 style={{ fontSize: "1.05rem" }}>{t.title}</h3>
                <p className="text-muted" style={{ fontSize: "0.85rem" }}>
                  {t.artist?.name}
                  {t.genre ? ` · ${t.genre}` : ""}
                </p>
                {t.preview_url && (
                  <audio
                    controls
                    src={t.preview_url}
                    style={{ width: "100%", marginTop: "0.75rem" }}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
