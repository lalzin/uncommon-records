import { supabase } from "@/lib/supabase";
import { json } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: artists } = await supabase
    .from("users")
    .select("*")
    .eq("role", "ARTIST")
    .eq("is_active", true);

  const ids = (artists ?? []).map((a) => a.id);
  const counts = new Map<number, number>();
  if (ids.length) {
    const { data: tracks } = await supabase
      .from("tracks")
      .select("artist_id")
      .eq("is_public", true)
      .in("artist_id", ids);
    for (const t of tracks ?? []) counts.set(t.artist_id, (counts.get(t.artist_id) ?? 0) + 1);
  }

  const result = (artists ?? []).map((a) => ({
    ...serializeUser(a),
    track_count: counts.get(a.id) ?? 0,
  }));
  return json({ artists: result });
}
