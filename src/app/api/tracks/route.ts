import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeTrack } from "@/lib/serializers";
import { trackInclude, likedTrackIds } from "@/lib/trackInclude";
import { allowedFile, saveImage, AUDIO_EXT, IMAGE_EXT } from "@/lib/storage";

// GET /api/tracks — public catalogue (or ?artist=me for the signed artist).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  const sp = req.nextUrl.searchParams;

  const where: Prisma.TrackWhereInput = {};
  if (sp.get("artist") === "me" && user && ["ARTIST", "ADMIN"].includes(user.role)) {
    where.artistId = user.id;
  } else {
    where.isPublic = true;
  }
  const genre = sp.get("genre");
  const artistId = sp.get("artist_id");
  const search = sp.get("search");
  if (genre) where.genre = { contains: genre, mode: "insensitive" };
  if (artistId) where.artistId = Number(artistId);
  if (search) where.title = { contains: search, mode: "insensitive" };

  const limit = sp.get("limit");
  const tracks = await prisma.track.findMany({
    where,
    include: trackInclude,
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: Number(limit) } : {}),
  });

  const liked = await likedTrackIds(user?.id ?? null, tracks.map((t) => t.id));
  return json({ tracks: tracks.map((t) => serializeTrack(t, liked.has(t.id))) });
}

// POST /api/tracks — create (ADMIN or ARTIST). Cover via multipart; audio key
// supplied after a direct-to-bucket presigned upload (see /api/uploads/presign).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) return error("Authentication required", 401);
  if (!["ADMIN", "ARTIST"].includes(user.role))
    return error("Insufficient permissions", 403);

  const form = await req.formData();

  // Audio: either a presigned-uploaded key, or an inline file (small files only).
  let audioKey = (form.get("audio_key") as string) || null;
  const audioFile = form.get("audio");
  if (!audioKey && audioFile instanceof File && audioFile.name) {
    if (!allowedFile(audioFile.name, AUDIO_EXT))
      return error("Invalid audio file type", 400);
    const { saveFile } = await import("@/lib/storage");
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
  const artistId =
    user.role === "ADMIN" ? Number(str("artist_id") || user.id) : user.id;

  const track = await prisma.track.create({
    data: {
      title: str("title") || "Untitled",
      genre: str("genre"),
      bpm: str("bpm") ? Number(str("bpm")) : null,
      key: str("key"),
      description: str("description"),
      coverImage: coverKey,
      audioFile: audioKey,
      duration: str("duration") ? Number(str("duration")) : null,
      isPublic: (str("is_public") || "true").toLowerCase() === "true",
      downloadable: (str("downloadable") || "true").toLowerCase() === "true",
      spotifyUrl: str("spotify_url"),
      soundcloudUrl: str("soundcloud_url"),
      beatportUrl: str("beatport_url"),
      artistId,
    },
    include: trackInclude,
  });
  return json(serializeTrack(track), 201);
}
