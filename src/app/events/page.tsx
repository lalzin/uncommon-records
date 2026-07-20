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
    iso
      ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : "";

  return (
    <div className="container section">
      <div className="badge">Agenda</div>
      <h1 className="display-lg" style={{ margin: "1rem 0 2.5rem" }}>
        Événements
      </h1>

      {loading ? (
        <p className="text-muted">Chargement…</p>
      ) : events.length === 0 ? (
        <p className="text-muted">Aucun événement publié.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {events.map((e) => (
            <article
              key={e.id}
              className="surface"
              style={{ display: "flex", gap: "1.5rem", padding: "1.25rem", alignItems: "center", flexWrap: "wrap" }}
            >
              {e.image_url && (
                <div
                  style={{
                    width: 120, height: 120, borderRadius: 12, flexShrink: 0,
                    background: `center/cover url(${e.image_url})`,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 220 }}>
                <div className="text-muted" style={{ fontSize: "0.8rem", color: "var(--color-gold)" }}>
                  {fmt(e.date)}
                </div>
                <h3 style={{ fontSize: "1.3rem", margin: "0.3rem 0" }}>{e.title}</h3>
                <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                  {[e.venue, e.location].filter(Boolean).join(" · ")}
                </p>
                {e.lineup.length > 0 && (
                  <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                    {e.lineup.join(" · ")}
                  </p>
                )}
              </div>
              {e.ticket_url && (
                <a href={e.ticket_url} target="_blank" rel="noreferrer" className="btn btn-outline">
                  Billets
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
