import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeSession } from "@/lib/serializers";
import { buildYoutubeEmbedUrl, buildYoutubeThumbnailUrl } from "@/lib/youtube";
import type { TableUpdate } from "@/lib/database.types";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { data: session } = await supabase.from("sessions").select("*").eq("id", Number(params.id)).maybeSingle();
  if (!session) return error("Not found", 404);
  const user = await getCurrentUser(req);
  if (!session.is_published && !(user && user.role === "ADMIN")) return error("Not found", 404);
  return json(serializeSession(session));
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser(req);
  if (!user || !user.is_active) return error("Authentication required", 401);
  if (user.role !== "ADMIN") return error("Insufficient permissions", 403);

  const id = Number(params.id);
  const { data: session } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
  if (!session) return error("Not found", 404);

  const data = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};

  if ("title" in data) {
    const title = String(data.title || "").trim();
    if (!title) return error("title is required", 400);
    update.title = title;
  }
  if ("description" in data) update.description = String(data.description || "").trim() || null;
  if ("youtube_url" in data) {
    const youtubeUrl = String(data.youtube_url || "").trim();
    const embedUrl = buildYoutubeEmbedUrl(youtubeUrl);
    if (!youtubeUrl || !embedUrl) return error("Invalid YouTube URL", 400);
    update.youtube_url = youtubeUrl;
    update.embed_url = embedUrl;
    update.thumbnail_url = buildYoutubeThumbnailUrl(youtubeUrl);
  }
  if ("is_published" in data) update.is_published = !!data.is_published;
  if ("is_featured" in data) update.is_featured = !!data.is_featured;
  if ("sort_order" in data) update.sort_order = Number(data.sort_order || 0);

  const { data: updated } = await supabase.from("sessions").update(update as TableUpdate<"sessions">).eq("id", id).select("*").single();
  return json(serializeSession(updated!));
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser(req);
  if (!user || !user.is_active) return error("Authentication required", 401);
  if (user.role !== "ADMIN") return error("Insufficient permissions", 403);
  const id = Number(params.id);
  const { data: session } = await supabase.from("sessions").select("id").eq("id", id).maybeSingle();
  if (!session) return error("Not found", 404);
  await supabase.from("sessions").delete().eq("id", id);
  return json({ message: "Deleted" });
}
