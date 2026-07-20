import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeTrack } from "@/lib/serializers";
import { trackInclude, likedTrackIds } from "@/lib/trackInclude";
import { allowedFile, saveImage, deleteFile, IMAGE_EXT } from "@/lib/storage";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const id = Number(params.id);
  const user = await getCurrentUser(req);
  const track = await prisma.track.findUnique({ where: { id }, include: trackInclude });
  if (!track) return error("Not found", 404);
  if (!track.isPublic && !(user && ["ADMIN", "ARTIST"].includes(user.role)))
    return error("Not found", 404);

  await prisma.track.update({ where: { id }, data: { playCount: { increment: 1 } } });
  const liked = await likedTrackIds(user?.id ?? null, [id]);
  return json(serializeTrack({ ...track, playCount: track.playCount + 1 }, liked.has(id)));
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const id = Number(params.id);
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) return error("Authentication required", 401);
  if (!["ADMIN", "ARTIST"].includes(user.role)) return error("Insufficient permissions", 403);

  const track = await prisma.track.findUnique({ where: { id } });
  if (!track) return error("Not found", 404);
  if (user.role === "ARTIST" && track.artistId !== user.id) return error("Forbidden", 403);

  const form = await req.formData();
  const update: Record<string, unknown> = {};

  const cover = form.get("cover");
  if (cover instanceof File && cover.name && allowedFile(cover.name, IMAGE_EXT)) {
    await deleteFile(track.coverImage);
    update.coverImage = await saveImage(cover, "covers");
  }

  const map: Record<string, string> = {
    title: "title", genre: "genre", key: "key", description: "description",
    spotify_url: "spotifyUrl", soundcloud_url: "soundcloudUrl", beatport_url: "beatportUrl",
  };
  for (const [formKey, col] of Object.entries(map)) {
    const v = form.get(formKey);
    if (typeof v === "string") update[col] = v;
  }
  const bpm = form.get("bpm");
  if (typeof bpm === "string" && bpm) update.bpm = Number(bpm);
  const isPublic = form.get("is_public");
  if (typeof isPublic === "string") update.isPublic = isPublic.toLowerCase() === "true";
  const downloadable = form.get("downloadable");
  if (typeof downloadable === "string") update.downloadable = downloadable.toLowerCase() === "true";

  const updated = await prisma.track.update({ where: { id }, data: update, include: trackInclude });
  return json(serializeTrack(updated));
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const id = Number(params.id);
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) return error("Authentication required", 401);
  if (!["ADMIN", "ARTIST"].includes(user.role)) return error("Insufficient permissions", 403);

  const track = await prisma.track.findUnique({ where: { id } });
  if (!track) return error("Not found", 404);
  if (user.role === "ARTIST" && track.artistId !== user.id) return error("Forbidden", 403);

  await deleteFile(track.audioFile);
  await deleteFile(track.coverImage);
  await prisma.track.delete({ where: { id } });
  return json({ message: "Deleted" });
}
