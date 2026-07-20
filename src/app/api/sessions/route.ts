import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeSession } from "@/lib/serializers";
import { buildYoutubeEmbedUrl, buildYoutubeThumbnailUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";

function ordered() {
  return supabase
    .from("sessions")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
}

export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get("limit");
  let q = ordered().eq("is_published", true);
  if (limit) q = q.limit(Number(limit));
  const { data } = await q;
  return json({ sessions: (data ?? []).map(serializeSession) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !user.is_active) return error("Authentication required", 401);
  if (user.role !== "ADMIN") return error("Insufficient permissions", 403);

  const data = await req.json().catch(() => ({}));
  const title = String(data.title || "").trim();
  const youtubeUrl = String(data.youtube_url || "").trim();
  if (!title || !youtubeUrl) return error("title and youtube_url are required", 400);

  const embedUrl = buildYoutubeEmbedUrl(youtubeUrl);
  if (!embedUrl) return error("Invalid YouTube URL", 400);

  const { data: session, error: insErr } = await supabase
    .from("sessions")
    .insert({
      title,
      description: String(data.description || "").trim() || null,
      youtube_url: youtubeUrl,
      embed_url: embedUrl,
      thumbnail_url: buildYoutubeThumbnailUrl(youtubeUrl),
      is_published: data.is_published ?? true,
      is_featured: data.is_featured ?? false,
      sort_order: Number(data.sort_order || 0),
    })
    .select("*")
    .single();
  if (insErr || !session) return error(insErr?.message || "Create failed", 500);

  return json(serializeSession(session), 201);
}
