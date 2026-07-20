import { supabase } from "@/lib/supabase";
import { requireRole, json } from "@/lib/auth";
import { serializeTrack, type TrackWithRel } from "@/lib/serializers";
import { TRACK_SELECT, likedTrackIds } from "@/lib/trackInclude";

export const dynamic = "force-dynamic";

// Downloadable promo pool for signed artists/admins.
export const GET = requireRole("ADMIN", "ARTIST")(async (req, { user }) => {
  const sp = req.nextUrl.searchParams;
  let q = supabase
    .from("tracks")
    .select(TRACK_SELECT)
    .eq("downloadable", true)
    .order("created_at", { ascending: false });
  const genre = sp.get("genre");
  const search = sp.get("search");
  if (genre) q = q.ilike("genre", `%${genre}%`);
  if (search) q = q.ilike("title", `%${search}%`);
  const limit = sp.get("limit");
  if (limit) q = q.limit(Number(limit));

  const { data } = await q;
  const tracks = (data ?? []) as unknown as TrackWithRel[];
  const liked = await likedTrackIds(user.id, tracks.map((t) => t.id));
  return json({ tracks: tracks.map((t) => serializeTrack(t, liked.has(t.id))) });
});
