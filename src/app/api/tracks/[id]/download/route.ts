import { supabase } from "@/lib/supabase";
import { requireRole, json, error } from "@/lib/auth";
import { presignDownload } from "@/lib/storage";

// Authenticated download. Logs the download and returns a direct/presigned URL.
export const GET = requireRole("ADMIN", "ARTIST", "USER")(async (req, { params, user }) => {
  const { data: track } = await supabase
    .from("tracks")
    .select("*")
    .eq("id", Number(params.id))
    .maybeSingle();
  if (!track) return error("Not found", 404);
  if (!track.downloadable) return error("Download not allowed", 403);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? null;
  await supabase.from("downloads").insert({ user_id: user.id, track_id: track.id, ip_address: ip });
  await supabase.from("tracks").update({ download_count: track.download_count + 1 }).eq("id", track.id);

  const filename = `${track.title.replace(/ /g, "_")}.${track.audio_file.split(".").pop()}`;
  if (track.audio_file.startsWith("http"))
    return json({ direct_url: track.audio_file, filename });
  return json({ direct_url: await presignDownload(track.audio_file, filename), filename });
});
