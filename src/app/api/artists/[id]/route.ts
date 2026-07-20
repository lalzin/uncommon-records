import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { json, error } from "@/lib/auth";
import { serializeUser, serializeTrack, type TrackWithRel } from "@/lib/serializers";
import { TRACK_SELECT } from "@/lib/trackInclude";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: artist } = await supabase
    .from("users")
    .select("*")
    .eq("id", Number(params.id))
    .eq("role", "ARTIST")
    .maybeSingle();
  if (!artist) return error("Not found", 404);

  const { data } = await supabase
    .from("tracks")
    .select(TRACK_SELECT)
    .eq("artist_id", artist.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  const tracks = (data ?? []) as unknown as TrackWithRel[];

  return json({
    artist: serializeUser(artist),
    tracks: tracks.map((t) => serializeTrack(t)),
  });
}
