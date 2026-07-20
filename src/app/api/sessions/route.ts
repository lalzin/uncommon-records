import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeSession } from "@/lib/serializers";
import { buildYoutubeEmbedUrl, buildYoutubeThumbnailUrl } from "@/lib/youtube";

const order = [
  { isFeatured: "desc" as const },
  { sortOrder: "asc" as const },
  { createdAt: "desc" as const },
];

export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get("limit");
  const sessions = await prisma.session.findMany({
    where: { isPublished: true },
    orderBy: order,
    ...(limit ? { take: Number(limit) } : {}),
  });
  return json({ sessions: sessions.map(serializeSession) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) return error("Authentication required", 401);
  if (user.role !== "ADMIN") return error("Insufficient permissions", 403);

  const data = await req.json().catch(() => ({}));
  const title = String(data.title || "").trim();
  const youtubeUrl = String(data.youtube_url || "").trim();
  if (!title || !youtubeUrl) return error("title and youtube_url are required", 400);

  const embedUrl = buildYoutubeEmbedUrl(youtubeUrl);
  if (!embedUrl) return error("Invalid YouTube URL", 400);

  const session = await prisma.session.create({
    data: {
      title,
      description: String(data.description || "").trim() || null,
      youtubeUrl,
      embedUrl,
      thumbnailUrl: buildYoutubeThumbnailUrl(youtubeUrl),
      isPublished: data.is_published ?? true,
      isFeatured: data.is_featured ?? false,
      sortOrder: Number(data.sort_order || 0),
    },
  });
  return json(serializeSession(session), 201);
}
