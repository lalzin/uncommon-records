import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, json } from "@/lib/auth";
import { serializeTrack } from "@/lib/serializers";
import { trackInclude, likedTrackIds } from "@/lib/trackInclude";

// Downloadable promo pool for signed artists/admins.
export const GET = requireRole("ADMIN", "ARTIST")(async (req, { user }) => {
  const sp = req.nextUrl.searchParams;
  const where: Prisma.TrackWhereInput = { downloadable: true };
  const genre = sp.get("genre");
  const search = sp.get("search");
  if (genre) where.genre = { contains: genre, mode: "insensitive" };
  if (search) where.title = { contains: search, mode: "insensitive" };
  const limit = sp.get("limit");

  const tracks = await prisma.track.findMany({
    where,
    include: trackInclude,
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: Number(limit) } : {}),
  });
  const liked = await likedTrackIds(user.id, tracks.map((t) => t.id));
  return json({ tracks: tracks.map((t) => serializeTrack(t, liked.has(t.id))) });
});
