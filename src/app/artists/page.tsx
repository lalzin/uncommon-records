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
      <div className="badge">Roster</div>
      <h1 className="display-lg" style={{ margin: "1rem 0 2.5rem" }}>
        Artistes
      </h1>

      {loading ? (
        <p className="text-muted">Chargement…</p>
      ) : (
        <div className="grid-auto">
          {artists.map((a) => (
            <article key={a.id} className="surface" style={{ padding: "1.5rem", textAlign: "center" }}>
              <div
                style={{
                  width: 96, height: 96, borderRadius: "50%", margin: "0 auto 1rem",
                  background: a.avatar
                    ? `center/cover url(${a.avatar})`
                    : "linear-gradient(135deg,#272524,#0c0b0b)",
                }}
              />
              <h3>{a.name}</h3>
              {a.bio && (
                <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                  {a.bio}
                </p>
              )}
              <p className="text-muted" style={{ fontSize: "0.75rem", marginTop: "0.75rem", color: "var(--color-gold)" }}>
                {a.track_count ?? 0} release{(a.track_count ?? 0) > 1 ? "s" : ""}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
