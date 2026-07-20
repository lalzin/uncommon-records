import { supabase } from "@/lib/supabase";
import { requireAuth, json, error } from "@/lib/auth";

export const POST = requireAuth(async (_req, { params, user }) => {
  const trackId = Number(params.id);
  const { data: track } = await supabase.from("tracks").select("id").eq("id", trackId).maybeSingle();
  if (!track) return error("Not found", 404);

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("track_id", trackId)
    .maybeSingle();

  let liked: boolean;
  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
    liked = false;
  } else {
    await supabase.from("likes").insert({ user_id: user.id, track_id: trackId });
    liked = true;
  }
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("track_id", trackId);
  return json({ liked, like_count: count ?? 0 });
});
