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
    <article className="surface" style={{ overflow: "hidden", gridColumn: featured ? "1 / -1" : undefined }}>
      <div style={{ position: "relative", aspectRatio: "16 / 9" }}>
        <iframe
          src={item.embed_url}
          title={item.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
      <div style={{ padding: "1.25rem" }}>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-gold)" }}>
          {featured ? "Session mise en avant" : "Session vidéo"}
        </div>
        <h2 style={{ fontSize: "1.3rem", margin: "0.4rem 0" }}>{item.title}</h2>
        <p className="text-muted" style={{ fontSize: "0.9rem" }}>
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
      <div className="badge">Vidéos</div>
      <h1 className="display-lg" style={{ margin: "1rem 0 2.5rem" }}>
        Sessions
      </h1>

      {loading ? (
        <p className="text-muted">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-muted">Aucune session publiée pour l&apos;instant.</p>
      ) : (
        <div className="grid-auto">
          {featured && <SessionCard item={featured} featured />}
          {rest.map((i) => (
            <SessionCard key={i.id} item={i} />
          ))}
        </div>
      )}
    </div>
  );
}
