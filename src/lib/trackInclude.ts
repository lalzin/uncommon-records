import { supabase } from "./supabase";

// PostgREST select string: track + its artist (many-to-one) + aggregated counts.
export const TRACK_SELECT =
  "*, artist:users!tracks_artist_id_fkey(*), likes(count), comments(count)";

/** Returns a Set of trackIds the user has liked, among the given ids. */
export async function likedTrackIds(
  userId: number | null,
  trackIds: number[],
): Promise<Set<number>> {
  if (!userId || trackIds.length === 0) return new Set();
  const { data } = await supabase
    .from("likes")
    .select("track_id")
    .eq("user_id", userId)
    .in("track_id", trackIds);
  return new Set((data ?? []).map((r) => r.track_id));
}
