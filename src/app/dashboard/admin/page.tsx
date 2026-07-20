"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, uploadAudioDirect } from "@/lib/apiClient";
import { guard, session } from "@/lib/clientAuth";
import { showToast, toast } from "@/lib/toast";
import Modal from "@/components/Modal";
import type { Track, EventItem, Artist } from "@/lib/types";

type Tab = "stats" | "tracks" | "events" | "sessions" | "artists" | "users" | "promos";
const TAB_LABELS: Record<Tab, string> = {
  stats: "Statistiques", tracks: "Morceaux", events: "Événements", sessions: "Sessions",
  artists: "Artistes", users: "Utilisateurs", promos: "Promos",
};

export default function AdminDashboard() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("stats");
  useEffect(() => { if (guard(["ADMIN"])) setReady(true); }, []);
  if (!ready) return null;

  return (
    <div className="container section dash">
      <aside className="dash-sidebar">
        <h3 style={{ marginBottom: "1rem", fontSize: "0.8rem", letterSpacing: "0.1em", color: "var(--color-gold)" }}>ADMIN</h3>
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button key={t} className={`sidebar-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{TAB_LABELS[t]}</button>
        ))}
        <button className="sidebar-tab" onClick={() => { session.clear(); window.location.href = "/login"; }}>Déconnexion</button>
      </aside>
      <section>
        <h1 className="display-md" style={{ marginBottom: "1.5rem" }}>{TAB_LABELS[tab]}</h1>
        {tab === "stats" && <Stats />}
        {tab === "tracks" && <TracksAdmin />}
        {tab === "events" && <EventsAdmin />}
        {tab === "sessions" && <SessionsAdmin />}
        {tab === "artists" && <ArtistsAdmin />}
        {tab === "users" && <UsersAdmin />}
        {tab === "promos" && <PromosAdmin />}
      </section>
    </div>
  );
}

// ── Stats ──────────────────────────────────────────────────────
interface StatsData { users: number; artists: number; tracks: number; events: number; sessions: number; likes: number; downloads: number; comments: number; }
interface Insights { recent_downloads: { id: number; created_at: string | null; ip_address: string | null; track: { title: string; artist_name: string } | null; downloader: { name: string; email: string } | null }[]; top_tracks: { title: string; artist_name: string; downloads_count: number }[]; top_downloaders: { name: string; email: string; role: string; downloads_count: number }[]; }

function Stats() {
  const [s, setS] = useState<StatsData | null>(null);
  const [ins, setIns] = useState<Insights | null>(null);
  useEffect(() => {
    api.get<StatsData>("/admin/stats").then(setS).catch(() => showToast("Erreur stats", "error"));
    api.get<Insights>("/admin/downloads/insights?limit=30").then(setIns).catch(() => {});
  }, []);
  if (!s) return <p className="text-muted">Chargement…</p>;
  const cards = [
    ["Morceaux", s.tracks], ["Artistes", s.artists], ["Événements", s.events], ["Sessions", s.sessions],
    ["Likes", s.likes], ["Downloads", s.downloads], ["Commentaires", s.comments], ["Utilisateurs", s.users],
  ] as const;
  return (
    <>
      <div className="stat-grid" style={{ marginBottom: "2.5rem" }}>
        {cards.map(([label, value]) => (
          <div key={label} className="stat-card"><div className="stat-card-value">{value}</div><div className="stat-card-label">{label}</div></div>
        ))}
      </div>
      {ins && (
        <>
          <h3 style={{ marginBottom: "1rem" }}>Téléchargements récents</h3>
          <div className="table-wrap" style={{ marginBottom: "2rem" }}>
            <table className="data-table">
              <thead><tr><th>Date</th><th>Morceau</th><th>Artiste</th><th>Par</th><th>IP</th></tr></thead>
              <tbody>
                {ins.recent_downloads.length === 0 ? (
                  <tr><td colSpan={5} className="text-muted" style={{ textAlign: "center", padding: "1.5rem" }}>Aucun téléchargement.</td></tr>
                ) : ins.recent_downloads.map((d) => (
                  <tr key={d.id}>
                    <td>{d.created_at ? new Date(d.created_at).toLocaleString("fr-FR") : "—"}</td>
                    <td>{d.track?.title || "—"}</td><td>{d.track?.artist_name || "—"}</td>
                    <td>{d.downloader?.name || "Anonyme"}</td><td>{d.ip_address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

// ── Tracks ─────────────────────────────────────────────────────
function TracksAdmin() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [editing, setEditing] = useState<Track | null>(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(() => { api.get<{ tracks: Track[] }>("/tracks").then((d) => setTracks(d.tracks)).catch(() => showToast("Erreur", "error")); }, []);
  useEffect(() => { load(); api.get<{ artists: Artist[] }>("/artists").then((d) => setArtists(d.artists)).catch(() => {}); }, [load]);

  async function remove(id: number, title: string) {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    try { await api.delete(`/tracks/${id}`); showToast("Supprimé", "success"); load(); } catch { showToast("Erreur", "error"); }
  }
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <span className="text-muted">{tracks.length} morceaux</span>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>+ Ajouter</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Titre</th><th>Artiste</th><th>Genre</th><th>Écoutes</th><th>Likes</th><th></th></tr></thead>
          <tbody>
            {tracks.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.title}</td><td>{t.artist?.name || "—"}</td><td>{t.genre || "—"}</td>
                <td>{t.play_count}</td><td>{t.like_count}</td>
                <td><div style={{ display: "flex", gap: "0.4rem" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(t)}>Modifier</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(t.id, t.title)}>Suppr.</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && <AdminTrackModal track={editing} artists={artists} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); load(); }} />}
    </>
  );
}

function AdminTrackModal({ track, artists, onClose, onSaved }: { track: Track | null; artists: Artist[]; onClose: () => void; onSaved: () => void }) {
  const editing = !!track;
  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: track?.title || "", genre: track?.genre || "", bpm: track?.bpm || "", key: track?.key || "",
    description: track?.description || "", spotify_url: track?.spotify_url || "", soundcloud_url: track?.soundcloud_url || "",
    beatport_url: track?.beatport_url || "", artist_id: track?.artist?.id || artists[0]?.id || "", downloadable: track?.downloadable ?? true,
  });
  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      fd.set("title", String(form.title).trim()); fd.set("genre", String(form.genre)); fd.set("bpm", String(form.bpm || ""));
      fd.set("key", String(form.key || "")); fd.set("description", String(form.description || ""));
      fd.set("spotify_url", String(form.spotify_url || "")); fd.set("soundcloud_url", String(form.soundcloud_url || ""));
      fd.set("beatport_url", String(form.beatport_url || "")); fd.set("artist_id", String(form.artist_id));
      fd.set("is_public", "true"); fd.set("downloadable", String(form.downloadable));
      const audio = audioRef.current?.files?.[0];
      if (audio) fd.set("audio_key", await uploadAudioDirect(audio));
      const cover = coverRef.current?.files?.[0];
      if (cover) fd.set("cover", cover);
      if (editing) { await api.uploadPut(`/tracks/${track!.id}`, fd); showToast("Modifié", "success"); }
      else { if (!audio) { showToast("Audio requis", "error"); setSaving(false); return; } await api.upload("/tracks", fd); showToast("Ajouté", "success"); }
      onSaved();
    } catch (err) { showToast((err as Error).message || "Erreur", "error"); } finally { setSaving(false); }
  }
  return (
    <Modal title={editing ? "Modifier le morceau" : "Ajouter un morceau"} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Artiste</label>
          <select className="form-input" value={form.artist_id} onChange={(e) => set("artist_id", e.target.value)}>
            {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div className="form-group"><label className="form-label">Genre</label><input className="form-input" value={form.genre} onChange={(e) => set("genre", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">BPM</label><input className="form-input" type="number" value={form.bpm} onChange={(e) => set("bpm", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Key</label><input className="form-input" value={form.key} onChange={(e) => set("key", e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Spotify</label><input className="form-input" value={form.spotify_url} onChange={(e) => set("spotify_url", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">SoundCloud</label><input className="form-input" value={form.soundcloud_url} onChange={(e) => set("soundcloud_url", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Beatport</label><input className="form-input" value={form.beatport_url} onChange={(e) => set("beatport_url", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Audio {editing && "(optionnel)"}</label><input ref={audioRef} className="form-input" type="file" accept="audio/*" /></div>
        <div className="form-group"><label className="form-label">Cover</label><input ref={coverRef} className="form-input" type="file" accept="image/*" /></div>
        <label className="checkbox-row"><input type="checkbox" checked={form.downloadable} onChange={(e) => set("downloadable", e.target.checked)} /> Téléchargeable (promo)</label>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={saving}>{saving ? "Envoi…" : "Enregistrer"}</button>
      </form>
    </Modal>
  );
}

// ── Events ─────────────────────────────────────────────────────
function EventsAdmin() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(() => { api.get<{ events: EventItem[] }>("/events/all").then((d) => setEvents(d.events)).catch(() => showToast("Erreur", "error")); }, []);
  useEffect(load, [load]);
  async function remove(id: number, title: string) { if (!confirm(`Supprimer "${title}" ?`)) return; try { await api.delete(`/events/${id}`); showToast("Supprimé", "success"); load(); } catch { showToast("Erreur", "error"); } }
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <span className="text-muted">{events.length} événements</span>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>+ Ajouter</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Titre</th><th>Date</th><th>Lieu</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td style={{ fontWeight: 600 }}>{ev.title}</td>
                <td>{ev.date ? new Date(ev.date).toLocaleDateString("fr-FR") : "—"}</td>
                <td>{ev.venue || ev.location || "—"}</td>
                <td><span className="badge">{(ev as EventItem & { is_published?: boolean }).is_published ? "Publié" : "Brouillon"}</span></td>
                <td><div style={{ display: "flex", gap: "0.4rem" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(ev)}>Modifier</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(ev.id, ev.title)}>Suppr.</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && <EventModal event={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); load(); }} />}
    </>
  );
}

function EventModal({ event, onClose, onSaved }: { event: EventItem | null; onClose: () => void; onSaved: () => void }) {
  const editing = !!event;
  const imgRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const ev = event as (EventItem & { is_published?: boolean; facebook_url?: string; ra_url?: string }) | null;
  const [form, setForm] = useState({
    title: ev?.title || "", date: ev?.date ? ev.date.substring(0, 16) : "", venue: ev?.venue || "", location: ev?.location || "",
    description: ev?.description || "", ticket_url: ev?.ticket_url || "", facebook_url: ev?.facebook_url || "", ra_url: ev?.ra_url || "",
    lineup: (ev?.lineup || []).join(", "), is_published: ev?.is_published ?? false, is_featured: ev?.is_featured ?? false,
  });
  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) { showToast("Date requise", "error"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("title", form.title); fd.set("date", form.date); fd.set("venue", form.venue); fd.set("location", form.location);
      fd.set("description", form.description); fd.set("ticket_url", form.ticket_url); fd.set("facebook_url", form.facebook_url); fd.set("ra_url", form.ra_url);
      fd.set("lineup", JSON.stringify(form.lineup.split(",").map((s) => s.trim()).filter(Boolean)));
      fd.set("is_published", String(form.is_published)); fd.set("is_featured", String(form.is_featured));
      const img = imgRef.current?.files?.[0]; if (img) fd.set("image", img);
      if (editing) { await api.uploadPut(`/events/${event!.id}`, fd); showToast("Modifié", "success"); }
      else { await api.upload("/events", fd); showToast("Ajouté", "success"); }
      onSaved();
    } catch (err) { showToast((err as Error).message || "Erreur", "error"); } finally { setSaving(false); }
  }
  return (
    <Modal title={editing ? "Modifier l'événement" : "Ajouter un événement"} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Date & heure</label><input className="form-input" type="datetime-local" value={form.date} onChange={(e) => set("date", e.target.value)} required /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group"><label className="form-label">Salle</label><input className="form-input" value={form.venue} onChange={(e) => set("venue", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Ville</label><input className="form-input" value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Lineup (séparés par des virgules)</label><input className="form-input" value={form.lineup} onChange={(e) => set("lineup", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Billetterie URL</label><input className="form-input" value={form.ticket_url} onChange={(e) => set("ticket_url", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Image</label><input ref={imgRef} className="form-input" type="file" accept="image/*" /></div>
        <label className="checkbox-row"><input type="checkbox" checked={form.is_published} onChange={(e) => set("is_published", e.target.checked)} /> Publié</label>
        <label className="checkbox-row"><input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Mis en avant</label>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={saving}>{saving ? "Envoi…" : "Enregistrer"}</button>
      </form>
    </Modal>
  );
}

// ── Sessions ───────────────────────────────────────────────────
interface SessionRow { id: number; title: string; description: string | null; youtube_url: string; sort_order: number; is_published: boolean; is_featured: boolean; }
function SessionsAdmin() {
  const [items, setItems] = useState<SessionRow[]>([]);
  const [editing, setEditing] = useState<SessionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(() => { api.get<{ sessions: SessionRow[] }>("/sessions/all").then((d) => setItems(d.sessions)).catch(() => showToast("Erreur", "error")); }, []);
  useEffect(load, [load]);
  async function remove(id: number, title: string) { if (!confirm(`Supprimer "${title}" ?`)) return; try { await api.delete(`/sessions/${id}`); showToast("Supprimé", "success"); load(); } catch { showToast("Erreur", "error"); } }
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <span className="text-muted">{items.length} sessions</span>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>+ Ajouter</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Titre</th><th>Ordre</th><th>Publié</th><th>Featured</th><th></th></tr></thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.title}</td><td>{s.sort_order}</td>
                <td><span className="badge">{s.is_published ? "Oui" : "Non"}</span></td>
                <td><span className="badge">{s.is_featured ? "Oui" : "Non"}</span></td>
                <td><div style={{ display: "flex", gap: "0.4rem" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(s)}>Modifier</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(s.id, s.title)}>Suppr.</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && <SessionModal item={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); load(); }} />}
    </>
  );
}

function SessionModal({ item, onClose, onSaved }: { item: SessionRow | null; onClose: () => void; onSaved: () => void }) {
  const editing = !!item;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: item?.title || "", youtube_url: item?.youtube_url || "", description: item?.description || "",
    sort_order: item?.sort_order || 0, is_published: item?.is_published ?? true, is_featured: item?.is_featured ?? false,
  });
  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const payload = { title: form.title.trim(), youtube_url: form.youtube_url.trim(), description: form.description.trim(), sort_order: Number(form.sort_order), is_published: form.is_published, is_featured: form.is_featured };
    try {
      if (editing) { await api.put(`/sessions/${item!.id}`, payload); showToast("Modifié", "success"); }
      else { await api.post("/sessions", payload); showToast("Ajouté", "success"); }
      onSaved();
    } catch (err) { showToast((err as Error).message || "Erreur", "error"); } finally { setSaving(false); }
  }
  return (
    <Modal title={editing ? "Modifier la session" : "Ajouter une session"} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">URL YouTube</label><input className="form-input" value={form.youtube_url} onChange={(e) => set("youtube_url", e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Ordre</label><input className="form-input" type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></div>
        <label className="checkbox-row"><input type="checkbox" checked={form.is_published} onChange={(e) => set("is_published", e.target.checked)} /> Publié</label>
        <label className="checkbox-row"><input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Mis en avant</label>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={saving}>{saving ? "Envoi…" : "Enregistrer"}</button>
      </form>
    </Modal>
  );
}

// ── Artists + invites ──────────────────────────────────────────
interface AdminArtist extends Artist { email: string; is_active: boolean; }
interface Invite { id: number; email: string | null; link: string; expires_at: string; used: boolean; }
function ArtistsAdmin() {
  const [artists, setArtists] = useState<AdminArtist[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [editing, setEditing] = useState<AdminArtist | null>(null);
  const [creating, setCreating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const loadArtists = useCallback(() => { api.get<{ artists: AdminArtist[] }>("/admin/artists").then((d) => setArtists(d.artists)).catch(() => showToast("Erreur", "error")); }, []);
  const loadInvites = useCallback(() => { api.get<Invite[]>("/admin/invites?type=artist").then(setInvites).catch(() => {}); }, []);
  useEffect(() => { loadArtists(); loadInvites(); }, [loadArtists, loadInvites]);

  async function remove(id: number, name: string) { if (!confirm(`Supprimer l'artiste "${name}" et ses morceaux ?`)) return; try { await api.delete(`/admin/artists/${id}`); showToast("Supprimé", "success"); loadArtists(); } catch { showToast("Erreur", "error"); } }
  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    try { const r = await api.post<{ email_sent: boolean }>("/admin/invite", { email: inviteEmail.trim(), type: "artist" }); showToast(r.email_sent ? "Invitation envoyée" : "Invitation créée (email non envoyé)", "success"); setInviteEmail(""); loadInvites(); }
    catch (err) { showToast((err as Error).message || "Erreur", "error"); }
  }
  async function revoke(id: number) { if (!confirm("Révoquer cette invitation ?")) return; try { await api.delete(`/admin/invites/${id}`); showToast("Révoquée", "success"); loadInvites(); } catch { showToast("Erreur", "error"); } }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <span className="text-muted">{artists.length} artistes</span>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>+ Ajouter</button>
      </div>
      <div className="table-wrap" style={{ marginBottom: "2.5rem" }}>
        <table className="data-table">
          <thead><tr><th>Nom</th><th>Email</th><th>Morceaux</th><th>Actif</th><th></th></tr></thead>
          <tbody>
            {artists.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{a.name}</td><td className="text-muted">{a.email}</td><td>{a.track_count || 0}</td>
                <td><span style={{ color: a.is_active ? "rgba(100,220,100,.9)" : "#ff8a8a" }}>●</span></td>
                <td><div style={{ display: "flex", gap: "0.4rem" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(a)}>Modifier</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(a.id, a.name)}>Suppr.</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: "1rem" }}>Invitations artistes</h3>
      <form onSubmit={sendInvite} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", maxWidth: 480 }}>
        <input className="form-input" type="email" placeholder="email@artiste.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
        <button className="btn btn-outline">Inviter</button>
      </form>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Email</th><th>Lien</th><th>Expire</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {invites.length === 0 ? (
              <tr><td colSpan={5} className="text-muted" style={{ textAlign: "center", padding: "1.5rem" }}>Aucune invitation.</td></tr>
            ) : invites.map((i) => {
              const expired = new Date(i.expires_at) < new Date();
              return (
                <tr key={i.id}>
                  <td>{i.email || "—"}</td>
                  <td style={{ maxWidth: 240, fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>
                    <a href={i.link} target="_blank" rel="noreferrer" style={{ color: "var(--color-gold)" }}>{i.link}</a>
                  </td>
                  <td>{new Date(i.expires_at).toLocaleDateString("fr-FR")}</td>
                  <td><span className="badge">{i.used ? "Utilisé" : expired ? "Expiré" : "En attente"}</span></td>
                  <td><div style={{ display: "flex", gap: "0.4rem" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(i.link); toast.success("Lien copié"); }}>Copier</button>
                    <button className="btn btn-danger btn-sm" onClick={() => revoke(i.id)}>Révoquer</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(creating || editing) && <ArtistModal artist={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); loadArtists(); }} />}
    </>
  );
}

function ArtistModal({ artist, onClose, onSaved }: { artist: AdminArtist | null; onClose: () => void; onSaved: () => void }) {
  const editing = !!artist;
  const avatarRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const s = artist?.social_links || {};
  const [form, setForm] = useState({
    name: artist?.name || "", email: artist?.email || "", password: "", bio: artist?.bio || "",
    instagram: s.instagram || "", soundcloud: s.soundcloud || "", beatport: s.beatport || "", spotify: s.spotify || "",
    is_active: artist?.is_active ?? true,
  });
  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      fd.set("name", form.name.trim()); fd.set("bio", form.bio);
      fd.set("instagram", form.instagram); fd.set("soundcloud", form.soundcloud); fd.set("beatport", form.beatport); fd.set("spotify", form.spotify);
      fd.set("is_active", String(form.is_active));
      const avatar = avatarRef.current?.files?.[0]; if (avatar) fd.set("avatar", avatar);
      if (editing) { await api.uploadPut(`/admin/artists/${artist!.id}`, fd); showToast("Modifié", "success"); }
      else { fd.set("email", form.email.trim()); fd.set("password", form.password); await api.upload("/admin/artists", fd); showToast("Ajouté", "success"); }
      onSaved();
    } catch (err) { showToast((err as Error).message || "Erreur", "error"); } finally { setSaving(false); }
  }
  return (
    <Modal title={editing ? "Modifier l'artiste" : "Ajouter un artiste"} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} disabled={editing} required={!editing} /></div>
        {!editing && <div className="form-group"><label className="form-label">Mot de passe (optionnel)</label><input className="form-input" type="text" value={form.password} onChange={(e) => set("password", e.target.value)} /></div>}
        <div className="form-group"><label className="form-label">Bio</label><textarea className="form-input" rows={2} value={form.bio} onChange={(e) => set("bio", e.target.value)} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group"><label className="form-label">Instagram</label><input className="form-input" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">SoundCloud</label><input className="form-input" value={form.soundcloud} onChange={(e) => set("soundcloud", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Beatport</label><input className="form-input" value={form.beatport} onChange={(e) => set("beatport", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Spotify</label><input className="form-input" value={form.spotify} onChange={(e) => set("spotify", e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Avatar</label><input ref={avatarRef} className="form-input" type="file" accept="image/*" /></div>
        <label className="checkbox-row"><input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} /> Compte actif</label>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={saving}>{saving ? "Envoi…" : "Enregistrer"}</button>
      </form>
    </Modal>
  );
}

// ── Users ──────────────────────────────────────────────────────
interface AdminUser { id: number; name: string; email: string; role: string; is_active: boolean; created_at: string | null; }
function UsersAdmin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  useEffect(() => { api.get<AdminUser[]>("/admin/users").then(setUsers).catch(() => showToast("Erreur", "error")); }, []);
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Actif</th><th>Inscrit</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={{ fontWeight: 600 }}>{u.name}</td><td className="text-muted">{u.email}</td>
              <td><span className="badge">{u.role}</span></td>
              <td><span style={{ color: u.is_active ? "rgba(100,220,100,.9)" : "#ff8a8a" }}>●</span></td>
              <td>{u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Promos ─────────────────────────────────────────────────────
function PromosAdmin() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [links, setLinks] = useState<(Invite & { track?: { title: string; artist_name: string } | null })[]>([]);
  const [trackId, setTrackId] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const load = useCallback(() => {
    api.get<{ tracks: Track[] }>("/tracks").then((d) => setTracks(d.tracks.filter((t) => t.downloadable))).catch(() => {});
    api.get<(Invite & { track?: { title: string; artist_name: string } | null })[]>("/admin/invites?type=promo_download").then(setLinks).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!trackId) { showToast("Choisis un morceau", "error"); return; }
    try { const d = await api.post<{ link: string }>("/admin/invite", { type: "promo_download", track_id: Number(trackId) }); setGenerated(d.link); showToast("Lien promo créé", "success"); load(); }
    catch (err) { showToast((err as Error).message || "Erreur", "error"); }
  }
  async function remove(id: number) { if (!confirm("Supprimer ce lien promo ?")) return; try { await api.delete(`/admin/invites/${id}`); showToast("Supprimé", "success"); load(); } catch { showToast("Erreur", "error"); } }

  return (
    <>
      <form onSubmit={generate} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", maxWidth: 560, flexWrap: "wrap" }}>
        <select className="form-input" style={{ flex: 1 }} value={trackId} onChange={(e) => setTrackId(e.target.value)}>
          <option value="">Choisir un morceau téléchargeable</option>
          {tracks.map((t) => <option key={t.id} value={t.id}>{t.title}{t.artist?.name ? ` — ${t.artist.name}` : ""}</option>)}
        </select>
        <button className="btn btn-primary">Générer un lien</button>
      </form>
      {generated && (
        <div className="surface" style={{ padding: "1rem", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
          <p style={{ color: "rgba(100,220,100,.9)", fontWeight: 600, marginBottom: "0.5rem" }}>✓ Lien promo créé</p>
          <p style={{ fontFamily: "monospace", wordBreak: "break-all", color: "var(--color-text-muted)" }}>{generated}</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: "0.5rem" }} onClick={() => { navigator.clipboard.writeText(generated); toast.success("Copié"); }}>Copier</button>
        </div>
      )}
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Morceau</th><th>Lien</th><th>Expire</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {links.length === 0 ? (
              <tr><td colSpan={5} className="text-muted" style={{ textAlign: "center", padding: "1.5rem" }}>Aucun lien promo.</td></tr>
            ) : links.map((i) => {
              const expired = new Date(i.expires_at) < new Date();
              return (
                <tr key={i.id}>
                  <td>{i.track?.title || "—"}{i.track?.artist_name ? ` — ${i.track.artist_name}` : ""}</td>
                  <td style={{ maxWidth: 240, fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>
                    <a href={i.link} target="_blank" rel="noreferrer" style={{ color: "var(--color-gold)" }}>{i.link}</a>
                  </td>
                  <td>{new Date(i.expires_at).toLocaleDateString("fr-FR")}</td>
                  <td><span className="badge">{i.used ? "Utilisé" : expired ? "Expiré" : "Actif"}</span></td>
                  <td><div style={{ display: "flex", gap: "0.4rem" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(i.link); toast.success("Copié"); }}>Copier</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(i.id)}>Suppr.</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
