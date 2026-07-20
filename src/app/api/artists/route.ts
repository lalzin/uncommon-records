import { prisma } from "@/lib/prisma";
import { json } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

// API routes must never be prerendered at build time (they hit the DB at request time).
export const dynamic = "force-dynamic";

export async function GET() {
  const artists = await prisma.user.findMany({
    where: { role: "ARTIST", isActive: true },
    include: { _count: { select: { tracks: { where: { isPublic: true } } } } },
  });
  const result = artists.map((a) => ({
    ...serializeUser(a),
    track_count: a._count.tracks,
  }));
  return json({ artists: result });
}
