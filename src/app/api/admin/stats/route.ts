import { supabase } from "@/lib/supabase";
import { requireRole, json } from "@/lib/auth";

const head = { count: "exact" as const, head: true };

export const GET = requireRole("ADMIN")(async () => {
  const [users, artists, tracks, events, sessions, likes, downloads, comments] =
    await Promise.all([
      supabase.from("users").select("*", head),
      supabase.from("users").select("*", head).eq("role", "ARTIST"),
      supabase.from("tracks").select("*", head),
      supabase.from("events").select("*", head),
      supabase.from("sessions").select("*", head),
      supabase.from("likes").select("*", head),
      supabase.from("downloads").select("*", head),
      supabase.from("comments").select("*", head),
    ]);
  return json({
    users: users.count ?? 0,
    artists: artists.count ?? 0,
    tracks: tracks.count ?? 0,
    events: events.count ?? 0,
    sessions: sessions.count ?? 0,
    likes: likes.count ?? 0,
    downloads: downloads.count ?? 0,
    comments: comments.count ?? 0,
  });
});
