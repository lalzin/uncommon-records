import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { error } from "@/lib/auth";
import { presignDownload } from "@/lib/storage";

// Anonymous download via promo token. Logs the download and 302-redirects to the file.
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const { data: invite } = await supabase
    .from("invite_tokens")
    .select("*")
    .eq("token", params.token)
    .eq("invite_type", "promo_download")
    .maybeSingle();
  if (!invite || invite.used || new Date(invite.expires_at) <= new Date())
    return error("Invalid or expired promo link", 404);
  if (!invite.track_id) return error("Invalid promo link", 400);

  const { data: track } = await supabase
    .from("tracks")
    .select("*")
    .eq("id", invite.track_id)
    .maybeSingle();
  if (!track) return error("Track not found", 404);
  if (!track.downloadable) return error("Download not allowed", 403);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? null;
  await supabase.from("downloads").insert({ user_id: null, track_id: track.id, ip_address: ip });
  await supabase.from("tracks").update({ download_count: track.download_count + 1 }).eq("id", track.id);

  const filename = `${track.title.replace(/ /g, "_")}.${track.audio_file.split(".").pop()}`;
  const url = track.audio_file.startsWith("http")
    ? track.audio_file
    : await presignDownload(track.audio_file, filename);
  return NextResponse.redirect(url, 302);
}
