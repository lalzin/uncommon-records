import { supabase } from "@/lib/supabase";
import { requireRole, json } from "@/lib/auth";

type RecentRow = {
  id: number;
  created_at: string | null;
  ip_address: string | null;
  track: { id: number; title: string; artist: { name: string } | null } | null;
  user: { id: number; name: string; email: string; role: string } | null;
};

export const GET = requireRole("ADMIN")(async (req) => {
  const raw = Number(req.nextUrl.searchParams.get("limit")) || 30;
  const limit = Math.max(1, Math.min(raw, 100));

  const { data: recentData } = await supabase
    .from("downloads")
    .select(
      "id, created_at, ip_address, track:tracks!downloads_track_id_fkey(id, title, artist:users!tracks_artist_id_fkey(name)), user:users!downloads_user_id_fkey(id, name, email, role)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  const recent = (recentData ?? []) as unknown as RecentRow[];

  const recent_downloads = recent.map((d) => ({
    id: d.id,
    created_at: d.created_at,
    ip_address: d.ip_address,
    track: d.track
      ? { id: d.track.id, title: d.track.title, artist_name: d.track.artist?.name ?? null }
      : null,
    downloader: d.user
      ? { id: d.user.id, name: d.user.name, email: d.user.email, role: d.user.role }
      : null,
  }));

  // Aggregate all downloads in JS (no groupBy in supabase-js).
  const { data: all } = await supabase.from("downloads").select("track_id, user_id");
  const trackTally = new Map<number, number>();
  const userTally = new Map<number, number>();
  for (const d of all ?? []) {
    trackTally.set(d.track_id, (trackTally.get(d.track_id) ?? 0) + 1);
    if (d.user_id) userTally.set(d.user_id, (userTally.get(d.user_id) ?? 0) + 1);
  }

  const topTrackIds = [...trackTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topUserIds = [...userTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const { data: trackRows } = await supabase
    .from("tracks")
    .select("id, title, artist:users!tracks_artist_id_fkey(name)")
    .in("id", topTrackIds.map(([id]) => id));
  const trackMap = new Map(
    ((trackRows ?? []) as unknown as { id: number; title: string; artist: { name: string } | null }[]).map(
      (t) => [t.id, t],
    ),
  );
  const top_tracks = topTrackIds.map(([id, count]) => ({
    track_id: id,
    title: trackMap.get(id)?.title ?? null,
    artist_name: trackMap.get(id)?.artist?.name ?? null,
    downloads_count: count,
  }));

  const { data: userRows } = await supabase
    .from("users")
    .select("id, name, email, role")
    .in("id", topUserIds.map(([id]) => id));
  const userMap = new Map((userRows ?? []).map((u) => [u.id, u]));
  const top_downloaders = topUserIds.map(([id, count]) => ({
    user_id: id,
    name: userMap.get(id)?.name ?? null,
    email: userMap.get(id)?.email ?? null,
    role: userMap.get(id)?.role ?? null,
    downloads_count: count,
  }));

  return json({ recent_downloads, top_tracks, top_downloaders });
});
