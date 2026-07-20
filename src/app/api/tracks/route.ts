import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeTrack, type TrackWithRel } from "@/lib/serializers";
import { TRACK_SELECT, likedTrackIds } from "@/lib/trackInclude";
import { allowedFile, saveImage, saveFile, AUDIO_EXT, IMAGE_EXT } from "@/lib/storage";

export const dynamic = "force-dynamic";

// GET /api/tracks — public catalogue (or ?artist=me for the signed artist).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  const sp = req.nextUrl.searchParams;

  let q = supabase.from("tracks").select(TRACK_SELECT).order("created_at", { ascending: false });

  if (sp.get("artist") === "me" && user && ["ARTIST", "ADMIN"].includes(user.role)) {
    q = q.eq("artist_id", user.id);
  } else {
    q = q.eq("is_public", true);
  }
  const genre = sp.get("genre");
  const artistId = sp.get("artist_id");
  const search = sp.get("search");
  if (genre) q = q.ilike("genre", `%${genre}%`);
  if (artistId) q = q.eq("artist_id", Number(artistId));
  if (search) q = q.ilike("title", `%${search}%`);
  const limit = sp.get("limit");
  if (limit) q = q.limit(Number(limit));

  const { data } = await q;
  const tracks = (data ?? []) as unknown as TrackWithRel[];
  const liked = await likedTrackIds(user?.id ?? null, tracks.map((t) => t.id));
  return json({ tracks: tracks.map((t) => serializeTrack(t, liked.has(t.id))) });
}

// POST /api/tracks — create (ADMIN or ARTIST). Cover via multipart; audio via a
// presigned direct-to-bucket upload (audio_key) or inline (small files).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !user.is_active) return error("Authentication required", 401);
  if (!["ADMIN", "ARTIST"].includes(user.role)) return error("Insufficient permissions", 403);

  const form = await req.formData();

  let audioKey = (form.get("audio_key") as string) || null;
  const audioFile = form.get("audio");
  if (!audioKey && audioFile instanceof File && audioFile.name) {
    if (!allowedFile(audioFile.name, AUDIO_EXT)) return error("Invalid audio file type", 400);
    audioKey = await saveFile(audioFile, "audio");
  }
  if (!audioKey) return error("Audio file required", 400);

  let coverKey: string | null = null;
  const cover = form.get("cover");
  if (cover instanceof File && cover.name && allowedFile(cover.name, IMAGE_EXT)) {
    coverKey = await saveImage(cover, "covers");
  }

  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" && v !== "" ? v : null;
  };
  const artistId = user.role === "ADMIN" ? Number(str("artist_id") || user.id) : user.id;

  const { data: track, error: insErr } = await supabase
    .from("tracks")
    .insert({
      title: str("title") || "Untitled",
      genre: str("genre"),
      bpm: str("bpm") ? Number(str("bpm")) : null,
      key: str("key"),
      description: str("description"),
      cover_image: coverKey,
      audio_file: audioKey,
      duration: str("duration") ? Number(str("duration")) : null,
      is_public: (str("is_public") || "true").toLowerCase() === "true",
      downloadable: (str("downloadable") || "true").toLowerCase() === "true",
      spotify_url: str("spotify_url"),
      soundcloud_url: str("soundcloud_url"),
      beatport_url: str("beatport_url"),
      artist_id: artistId,
    })
    .select(TRACK_SELECT)
    .single();
  if (insErr || !track) return error(insErr?.message || "Create failed", 500);

  return json(serializeTrack(track as unknown as TrackWithRel), 201);
}
