"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/apiClient";
import { session } from "@/lib/clientAuth";
import { toast } from "@/lib/toast";

interface PromoTrack {
  id: number;
  title: string;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  description: string | null;
  duration: number | null;
  like_count: number;
  comment_count: number;
  liked: boolean;
  cover_url: string | null;
  preview_url: string | null;
  download_url: string;
  spotify_url: string | null;
  soundcloud_url: string | null;
  beatport_url: string | null;
  artist: { id: number; name: string; bio: string | null } | null;
}

interface Comment {
  id: number;
  content: string;
  created_at: string | null;
  user: { name: string; email?: string } | null;
}

export default function PromoPage() {
  const { token } = useParams<{ token: string }>();
  const [track, setTrack] = useState<PromoTrack | null>(null);
  const [expires, setExpires] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const loggedIn = typeof window !== "undefined" && session.isLoggedIn();

  const loadComments = useCallback(async (trackId: number) => {
    try {
      setComments(await api.get<Comment[]>(`/tracks/${trackId}/comments`));
    } catch {
      setComments([]);
    }
  }, []);

  useEffect(() => {
    api
      .get<{ track: PromoTrack; expires_at: string | null }>(`/tracks/promo/${token}`)
      .then((d) => {
        setTrack(d.track);
        setExpires(d.expires_at);
        loadComments(d.track.id);
      })
      .catch((e) => setError((e as Error).message || "Ce lien promo est invalide ou expiré."));
  }, [token, loadComments]);

  async function toggleLike() {
    if (!track) return;
    if (!loggedIn) return toast.info("Connectez-vous pour liker ce morceau.");
    try {
      const res = await api.post<{ liked: boolean; like_count: number }>(`/tracks/${track.id}/like`);
      setTrack({ ...track, liked: res.liked, like_count: res.like_count });
    } catch {
      toast.error("Impossible d'enregistrer votre like.");
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!track) return;
    if (!loggedIn) return toast.info("Connectez-vous pour commenter.");
    if (!commentText.trim()) return toast.warning("Votre commentaire est vide.");
    try {
      await api.post(`/tracks/${track.id}/comments`, { content: commentText.trim() });
      setCommentText("");
      setTrack({ ...track, comment_count: track.comment_count + 1 });
      loadComments(track.id);
    } catch {
      toast.error("Impossible de publier le commentaire.");
    }
  }

  if (error) return <div className="container section"><p style={{ color: "#ff8a8a" }}>{error}</p></div>;
  if (!track) return <div className="container section"><p className="text-muted">Chargement…</p></div>;

  const chips = [
    track.genre && `Genre: ${track.genre}`,
    track.bpm && `${track.bpm} BPM`,
    track.key && `Key: ${track.key}`,
    track.duration && `${track.duration}s`,
  ].filter(Boolean) as string[];

  const externals = [
    { href: track.spotify_url, label: "Spotify" },
    { href: track.soundcloud_url, label: "SoundCloud" },
    { href: track.beatport_url, label: "Beatport" },
  ].filter((x) => x.href);

  return (
    <div className="container section" style={{ maxWidth: 760 }}>
      <div className="badge">Promo privée</div>
      <div className="surface" style={{ padding: "1.75rem", marginTop: "1.5rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        <div
          style={{
            width: 180, height: 180, borderRadius: 12, flexShrink: 0,
            background: track.cover_url ? `center/cover url(${track.cover_url})` : "linear-gradient(135deg,#272524,#0c0b0b)",
          }}
        />
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ fontSize: "1.8rem" }}>{track.title}</h1>
          <p className="text-muted" style={{ color: "var(--color-gold)" }}>{track.artist?.name || "Uncommon Records"}</p>
          <p className="text-muted" style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            {track.description || "Morceau promo privé Uncommon Records."}
          </p>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
            {chips.map((c) => (
              <span key={c} className="badge" style={{ background: "var(--color-surface-3)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {track.preview_url && (
        <audio controls src={track.preview_url} style={{ width: "100%", marginTop: "1.25rem" }} />
      )}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginTop: "1.25rem" }}>
        <a href={track.download_url} className="btn btn-primary">⬇ Télécharger</a>
        <button className="btn btn-outline" onClick={toggleLike}>
          {track.liked ? "♥" : "♡"} {track.like_count}
        </button>
        {externals.map((x) => (
          <a key={x.label} href={x.href!} target="_blank" rel="noreferrer" className="btn btn-outline">
            {x.label}
          </a>
        ))}
      </div>

      {expires && (
        <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
          Lien valable jusqu&apos;au {new Date(expires).toLocaleString("fr-FR")}
        </p>
      )}

      {/* Comments */}
      <h3 style={{ marginTop: "2.5rem", marginBottom: "1rem" }}>
        Retours · {track.like_count} like{track.like_count > 1 ? "s" : ""} • {track.comment_count} commentaire{track.comment_count > 1 ? "s" : ""}
      </h3>
      <form onSubmit={submitComment} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          className="form-input"
          placeholder={loggedIn ? "Votre commentaire…" : "Connectez-vous pour commenter"}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={!loggedIn}
        />
        <button className="btn btn-outline" disabled={!loggedIn}>Envoyer</button>
      </form>
      {comments.length === 0 ? (
        <p className="text-muted">Aucun commentaire pour le moment.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {comments.map((c) => (
            <article key={c.id} className="surface" style={{ padding: "0.9rem 1.1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                <span style={{ fontWeight: 600 }}>{c.user?.name || "Utilisateur"}</span>
                <span className="text-muted">{c.created_at ? new Date(c.created_at).toLocaleString("fr-FR") : ""}</span>
              </div>
              <p style={{ fontSize: "0.9rem", marginTop: "0.4rem" }}>{c.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
