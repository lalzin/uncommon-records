"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import type { EventItem } from "@/lib/types";

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ events: EventItem[] }>("/events")
      .then((d) => setEvents(d.events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "";
  const now = Date.now();

  return (
    <div className="container section">
      <header className="page-head">
        <span className="badge">Agenda</span>
        <h1 className="section-title">Événements</h1>
        <p className="lead">Nos shows et soirées label — Rennes et au-delà.</p>
      </header>

      {loading ? (
        <p className="text-muted">Chargement…</p>
      ) : events.length === 0 ? (
        <div className="empty">
          <span className="empty-mark">◆</span>
          <p style={{ fontWeight: 600, color: "var(--text)" }}>Aucun événement à l&apos;affiche.</p>
          <p style={{ fontSize: "0.9rem" }}>Les prochaines dates seront annoncées ici.</p>
        </div>
      ) : (
        <div className="ev-list">
          {events.map((e) => {
            const upcoming = e.date ? new Date(e.date).getTime() > now : false;
            return (
              <article key={e.id} className="ev card rise">
                <div className="ev-poster" style={e.image_url ? { backgroundImage: `url(${e.image_url})` } : undefined} />
                <div className="ev-body">
                  <div className="ev-meta">
                    <span className="text-gold" style={{ fontWeight: 600, fontSize: "0.82rem", letterSpacing: "0.04em" }}>{fmt(e.date)}</span>
                    <span className={`chip ${upcoming ? "chip-live" : ""}`}>{upcoming ? "À venir" : "Archive"}</span>
                  </div>
                  <h3 className="ev-title">{e.title}</h3>
                  <p className="text-muted ev-place">{[e.venue, e.location].filter(Boolean).join(" · ")}</p>
                  {e.lineup.length > 0 && <p className="ev-lineup">{e.lineup.join("  ·  ")}</p>}
                </div>
                {e.ticket_url && (
                  <a href={e.ticket_url} target="_blank" rel="noreferrer" className="btn btn-outline ev-cta">Billets</a>
                )}
              </article>
            );
          })}
        </div>
      )}

      <style>{`
        .ev-list { display: flex; flex-direction: column; gap: 1rem; }
        .ev { display: grid; grid-template-columns: 150px 1fr auto; align-items: center; gap: 1.5rem; padding: 1.1rem; }
        .ev-poster { width: 150px; height: 150px; border-radius: var(--r-md); background: linear-gradient(135deg, var(--surface-3), var(--bg-2)); background-size: cover; background-position: center; flex-shrink: 0; }
        .ev-body { display: flex; flex-direction: column; gap: 0.4rem; min-width: 0; }
        .ev-meta { display: flex; align-items: center; gap: 0.75rem; }
        .chip-live { background: var(--gold-dim); color: var(--gold-2); border-color: var(--gold-line); }
        .ev-title { font-size: clamp(1.3rem, 2.4vw, 1.9rem); letter-spacing: -0.02em; }
        .ev-place { font-size: 0.92rem; }
        .ev-lineup { font-size: 0.82rem; color: var(--faint); margin-top: 0.3rem; }
        .ev-cta { flex-shrink: 0; }
        @media (max-width: 720px) {
          .ev { grid-template-columns: 90px 1fr; }
          .ev-poster { width: 90px; height: 90px; }
          .ev-cta { grid-column: 1 / -1; justify-self: start; }
        }
      `}</style>
    </div>
  );
}
