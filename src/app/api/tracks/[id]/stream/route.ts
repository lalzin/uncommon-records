import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { json, error } from "@/lib/auth";
import { publicUrl } from "@/lib/storage";

// Returns a playable URL. Audio lives in the object store (or a remote demo URL).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data: track } = await supabase
    .from("tracks")
    .select("audio_file, is_public")
    .eq("id", Number(params.id))
    .maybeSingle();
  if (!track) return error("Not found", 404);
  if (!track.is_public) return error("Not found", 404);
  return json({ stream_url: publicUrl(track.audio_file) });
}
