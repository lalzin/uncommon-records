"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, uploadAudioDirect } from "@/lib/apiClient";
import { guard, session } from "@/lib/clientAuth";
import { showToast } from "@/lib/toast";
import Modal from "@/components/Modal";
import type { Track } from "@/lib/types";

type Tab = "overview" | "tracks" | "promo" | "profile";

export default function ArtistDashboard() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (guard(["ARTIST", "ADMIN"])) setReady(true);
  }, []);

  if (!ready) return null;
  const user = session.getUser();

  return (
    <div className="container section dash">
      <aside className="dash-sidebar">
        <h3 style={{ marginBottom: "1rem", fontSize: "0.8rem", letterSpacing: "0.1em", color: "var(--color-gold)" }}>
          ESPACE ARTISTE
        </h3>
        {(["overview", "tracks", "promo", "profile"] as Tab[]).map((t) => (
          <button key={t} className={`sidebar-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {{ overview: "Aperçu", tracks: "Mes musiques", promo: "Promo", profile: "Profil" }[t]}
          </button>
        ))}
        <button className="sidebar-tab" onClick={() => { session.clear(); window.location.href = "/login"; }}>
          Déconnexion
        </button>
      </aside>

      <section>
        <h1 className="display-md" style={{ marginBottom: "1.5rem" }}>
          Bonjour, {user?.name} 👋
        </h1>
        {tab === "overview" && <Overview />}
        {tab === "tracks" && <MyTracks />}
        {tab === "promo" && <PromoPool />}
        {tab === "profile" && <Profile />}
      </section>
    </div>
  );
}

// ── Overview ───────────────────────────────────────────────────
function Overview() {
  const [tracks, setTracks] = useState<Track[]>([]);
  useEffect(() => {
    api.get<{ tracks: Track[] }>("/tracks?artist=me&limit=5").then((d) => setTracks(d.tracks)).catch(() => {});
  }, []);
  const plays = tracks.reduce((s, t) => s + (t.play_count || 0), 0);
  const dl = tracks.reduce((s, t) => s + (t.download_count || 0), 0);
  return (
    <>
      <div className="stat-grid" style={{ marginBottom: "2rem" }}>
        <div className="stat-card"><span className="stat-label">Sorties</span><span className="stat-value">{tracks.length}</span></div>
        <div className="stat-card"><span className="stat-label">Écoutes</span><span className="stat-value">{plays.toLocaleString("fr-FR")}</span></div>
        <div className="stat-card"><span className="stat-label">Téléchargements</span><span className="stat-value">{dl.toLocaleString("fr-FR")}</span></div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Titre</th><th>Genre</th><th>Écoutes</th><th>DL</th><th>Statut</th></tr></thead>
          <tbody>
            {tracks.length === 0 ? (
              <tr><td colSpan={5} className="text-muted" style={{ textAlign: "center", padding: "2rem" }}>Aucune sortie.</td></tr>
            ) : tracks.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td><td>{t.genre || "—"}</td>
                <td>{t.play_count}</td><td>{t.download_count}</td>
                <td><span className="badge">{t.is_public ? "Public" : "Privé"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── My tracks (CRUD) ───────────────────────────────────────────
function MyTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [editing, setEditing] = useState<Track | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api.get<{ tracks: Track[] }>("/tracks?artist=me&limit=200").then((d) => setTracks(d.tracks)).catch(() => showToast("Erreur chargement", "error"));
  }, []);
  useEffect(load, [load]);

  async function remove(id: number) {
    if (!confirm("Supprimer cette musique ?")) return;
    try { await api.delete(`/tracks/${id}`); showToast("Supprimé", "success"); load(); }
    catch { showToast("Erreur suppression", "error"); }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.3rem" }}>Mes musiques</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>+ Ajouter</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Titre</th><th>Genre</th><th>BPM</th><th>Écoutes</th><th>DL</th><th>Public</th><th></th></tr></thead>
          <tbody>
            {tracks.length === 0 ? (
              <tr><td colSpan={7} className="text-muted" style={{ textAlign: "center", padding: "2rem" }}>Aucune musique.</td></tr>
            ) : tracks.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.title}</td><td>{t.genre || "—"}</td><td>{t.bpm || "—"}</td>
                <td>{t.play_count}</td><td>{t.download_count}</td>
                <td><span className="badge">{t.is_public ? "Oui" : "Non"}</span></td>
                <td><div style={{ display: "flex", gap: "0.4rem" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(t)}>Modifier</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(t.id)}>Suppr.</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && (
        <TrackModal track={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); load(); }} />
      )}
    </>
  );
}

function TrackModal({ track, onClose, onSaved }: { track: Track | null; onClose: () => void; onSaved: () => void }) {
  const editing = !!track;
  const audioRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: track?.title || "", genre: track?.genre || "", bpm: track?.bpm || "",
    key: track?.key || "", description: track?.description || "",
    spotify_url: track?.spotify_url || "", beatport_url: track?.beatport_url || "",
    is_public: track?.is_public ?? true, downloadable: track?.downloadable ?? true,
  });
  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("title", String(form.title).trim());
      fd.set("genre", String(form.genre));
      fd.set("bpm", String(form.bpm || ""));
      fd.set("key", String(form.key || ""));
      fd.set("description", String(form.description || ""));
      fd.set("spotify_url", String(form.spotify_url || ""));
      fd.set("beatport_url", String(form.beatport_url || ""));
      fd.set("is_public", String(form.is_public));
      fd.set("downloadable", String(form.downloadable));

      const audio = audioRef.current?.files?.[0];
      if (audio) fd.set("audio_key", await uploadAudioDirect(audio));
      const cover = coverRef.current?.files?.[0];
      if (cover) fd.set("cover", cover);

      if (editing) { await api.uploadPut(`/tracks/${track!.id}`, fd); showToast("Musique mise à jour", "success"); }
      else {
        if (!audio) { showToast("Fichier audio requis", "error"); setSaving(false); return; }
        await api.upload("/tracks", fd); showToast("Musique ajoutée", "success");
      }
      onSaved();
    } catch (err) {
      showToast((err as Error).message || "Erreur", "error");
    } finally { setSaving(false); }
  }

  return (
    <Modal title={editing ? "Modifier la musique" : "Ajouter une musique"} onClose={onClose}>
      <form onSubmit={save}>
        <div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group"><label className="form-label">Genre</label><input className="form-input" value={form.genre} onChange={(e) => set("genre", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">BPM</label><input className="form-input" type="number" value={form.bpm} onChange={(e) => set("bpm", e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Key</label><input className="form-input" value={form.key} onChange={(e) => set("key", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Spotify URL</label><input className="form-input" value={form.spotify_url} onChange={(e) => set("spotify_url", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Beatport URL</label><input className="form-input" value={form.beatport_url} onChange={(e) => set("beatport_url", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Audio {editing && "(laisser vide pour conserver)"}</label><input ref={audioRef} className="form-input" type="file" accept="audio/*" /></div>
        <div className="form-group"><label className="form-label">Cover</label><input ref={coverRef} className="form-input" type="file" accept="image/*" /></div>
        <label className="checkbox-row"><input type="checkbox" checked={form.is_public} onChange={(e) => set("is_public", e.target.checked)} /> Public</label>
        <label className="checkbox-row"><input type="checkbox" checked={form.downloadable} onChange={(e) => set("downloadable", e.target.checked)} /> Téléchargeable (promo)</label>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={saving}>{saving ? "Envoi…" : "Enregistrer"}</button>
      </form>
    </Modal>
  );
}

// ── Promo pool ─────────────────────────────────────────────────
function PromoPool() {
  const [tracks, setTracks] = useState<Track[]>([]);
  useEffect(() => {
    api.get<{ tracks: Track[] }>("/tracks/promo?limit=300").then((d) => setTracks(d.tracks)).catch(() => {});
  }, []);

  async function download(id: number) {
    try {
      const d = await api.get<{ direct_url: string; filename: string }>(`/tracks/${id}/download`);
      const a = document.createElement("a");
      a.href = d.direct_url; a.download = d.filename; a.target = "_blank";
      document.body.appendChild(a); a.click(); a.remove();
      showToast("Téléchargement démarré", "success");
    } catch (err) { showToast((err as Error).message || "Téléchargement impossible", "error"); }
  }

  return (
    <>
      <h2 style={{ fontSize: "1.3rem", marginBottom: "1.25rem" }}>Promo — pool de téléchargement</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Titre</th><th>Artiste</th><th>Genre</th><th>BPM</th><th></th></tr></thead>
          <tbody>
            {tracks.length === 0 ? (
              <tr><td colSpan={5} className="text-muted" style={{ textAlign: "center", padding: "2rem" }}>Aucune promo disponible.</td></tr>
            ) : tracks.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td><td>{t.artist?.name || "—"}</td><td>{t.genre || "—"}</td><td>{t.bpm || "—"}</td>
                <td><button className="btn btn-secondary btn-sm" onClick={() => download(t.id)}>Télécharger</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Profile ────────────────────────────────────────────────────
function Profile() {
  const [form, setForm] = useState({ name: "", email: "", bio: "", soundcloud: "", instagram: "", beatport: "" });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ name: string; email: string; bio: string | null; avatar: string | null; social_links: Record<string, string> }>("/auth/me").then((u) => {
      setForm({ name: u.name || "", email: u.email || "", bio: u.bio || "", soundcloud: u.social_links?.soundcloud || "", instagram: u.social_links?.instagram || "", beatport: u.social_links?.beatport || "" });
      setAvatar(u.avatar);
    }).catch(() => showToast("Erreur chargement profil", "error"));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/auth/me", { name: form.name.trim(), bio: form.bio.trim(), social_links: { soundcloud: form.soundcloud.trim(), instagram: form.instagram.trim(), beatport: form.beatport.trim() } });
      showToast("Profil mis à jour", "success");
    } catch { showToast("Erreur sauvegarde", "error"); } finally { setSaving(false); }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.set("avatar", file);
    try { const d = await api.upload<{ avatar: string }>("/admin/profile/avatar", fd); setAvatar(d.avatar); showToast("Photo mise à jour", "success"); }
    catch { showToast("Erreur photo", "error"); }
  }

  return (
    <form onSubmit={save} style={{ maxWidth: 520 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: avatar ? `center/cover url(${avatar})` : "var(--color-gold-dim)" }} />
        <label className="btn btn-secondary btn-sm">Changer la photo<input type="file" accept="image/*" hidden onChange={uploadAvatar} /></label>
      </div>
      <div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} readOnly /></div>
      <div className="form-group"><label className="form-label">Bio</label><textarea className="form-input" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
      <div className="form-group"><label className="form-label">SoundCloud</label><input className="form-input" value={form.soundcloud} onChange={(e) => setForm({ ...form, soundcloud: e.target.value })} /></div>
      <div className="form-group"><label className="form-label">Instagram</label><input className="form-input" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
      <div className="form-group"><label className="form-label">Beatport</label><input className="form-input" value={form.beatport} onChange={(e) => setForm({ ...form, beatport: e.target.value })} /></div>
      <button className="btn btn-primary" disabled={saving}>{saving ? "Sauvegarde…" : "Sauvegarder"}</button>
    </form>
  );
}
