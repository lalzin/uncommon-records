import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeTrack, type TrackWithRel } from "@/lib/serializers";
import { TRACK_SELECT, likedTrackIds } from "@/lib/trackInclude";
import { allowedFile, saveImage, deleteFile, IMAGE_EXT } from "@/lib/storage";
import type { TableUpdate } from "@/lib/database.types";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const id = Number(params.id);
  const user = await getCurrentUser(req);
  const { data } = await supabase.from("tracks").select(TRACK_SELECT).eq("id", id).maybeSingle();
  const track = data as unknown as TrackWithRel | null;
  if (!track) return error("Not found", 404);
  if (!track.is_public && !(user && ["ADMIN", "ARTIST"].includes(user.role)))
    return error("Not found", 404);

  await supabase.from("tracks").update({ play_count: track.play_count + 1 }).eq("id", id);
  const liked = await likedTrackIds(user?.id ?? null, [id]);
  return json(serializeTrack({ ...track, play_count: track.play_count + 1 }, liked.has(id)));
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const id = Number(params.id);
  const user = await getCurrentUser(req);
  if (!user || !user.is_active) return error("Authentication required", 401);
  if (!["ADMIN", "ARTIST"].includes(user.role)) return error("Insufficient permissions", 403);

  const { data: track } = await supabase.from("tracks").select("*").eq("id", id).maybeSingle();
  if (!track) return error("Not found", 404);
  if (user.role === "ARTIST" && track.artist_id !== user.id) return error("Forbidden", 403);

  const form = await req.formData();
  const update: Record<string, unknown> = {};

  const cover = form.get("cover");
  if (cover instanceof File && cover.name && allowedFile(cover.name, IMAGE_EXT)) {
    await deleteFile(track.cover_image);
    update.cover_image = await saveImage(cover, "covers");
  }

  const map: Record<string, string> = {
    title: "title", genre: "genre", key: "key", description: "description",
    spotify_url: "spotify_url", soundcloud_url: "soundcloud_url", beatport_url: "beatport_url",
  };
  for (const [formKey, col] of Object.entries(map)) {
    const v = form.get(formKey);
    if (typeof v === "string") update[col] = v;
  }
  const bpm = form.get("bpm");
  if (typeof bpm === "string" && bpm) update.bpm = Number(bpm);
  const isPublic = form.get("is_public");
  if (typeof isPublic === "string") update.is_public = isPublic.toLowerCase() === "true";
  const downloadable = form.get("downloadable");
  if (typeof downloadable === "string") update.downloadable = downloadable.toLowerCase() === "true";

  const { data: updated } = await supabase
    .from("tracks").update(update as TableUpdate<"tracks">).eq("id", id).select(TRACK_SELECT).single();
  return json(serializeTrack(updated as unknown as TrackWithRel));
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const id = Number(params.id);
  const user = await getCurrentUser(req);
  if (!user || !user.is_active) return error("Authentication required", 401);
  if (!["ADMIN", "ARTIST"].includes(user.role)) return error("Insufficient permissions", 403);

  const { data: track } = await supabase.from("tracks").select("*").eq("id", id).maybeSingle();
  if (!track) return error("Not found", 404);
  if (user.role === "ARTIST" && track.artist_id !== user.id) return error("Forbidden", 403);

  await deleteFile(track.audio_file);
  await deleteFile(track.cover_image);
  await supabase.from("tracks").delete().eq("id", id);
  return json({ message: "Deleted" });
}
