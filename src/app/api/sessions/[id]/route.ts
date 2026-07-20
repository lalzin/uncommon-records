import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeSession } from "@/lib/serializers";
import { buildYoutubeEmbedUrl, buildYoutubeThumbnailUrl } from "@/lib/youtube";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await prisma.session.findUnique({ where: { id: Number(params.id) } });
  if (!session) return error("Not found", 404);
  const user = await getCurrentUser(req);
  if (!session.isPublished && !(user && user.role === "ADMIN")) return error("Not found", 404);
  return json(serializeSession(session));
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) return error("Authentication required", 401);
  if (user.role !== "ADMIN") return error("Insufficient permissions", 403);

  const id = Number(params.id);
  const session = await prisma.session.findUnique({ where: { id } });
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
    update.youtubeUrl = youtubeUrl;
    update.embedUrl = embedUrl;
    update.thumbnailUrl = buildYoutubeThumbnailUrl(youtubeUrl);
  }
  if ("is_published" in data) update.isPublished = !!data.is_published;
  if ("is_featured" in data) update.isFeatured = !!data.is_featured;
  if ("sort_order" in data) update.sortOrder = Number(data.sort_order || 0);

  const updated = await prisma.session.update({ where: { id }, data: update });
  return json(serializeSession(updated));
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) return error("Authentication required", 401);
  if (user.role !== "ADMIN") return error("Insufficient permissions", 403);
  const id = Number(params.id);
  if (!(await prisma.session.findUnique({ where: { id } }))) return error("Not found", 404);
  await prisma.session.delete({ where: { id } });
  return json({ message: "Deleted" });
}
