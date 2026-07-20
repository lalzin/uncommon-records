import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const trackInclude = {
  artist: true,
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.TrackInclude;

/** Returns a Set of trackIds the user has liked, among the given ids. */
export async function likedTrackIds(
  userId: number | null,
  trackIds: number[],
): Promise<Set<number>> {
  if (!userId || trackIds.length === 0) return new Set();
  const rows = await prisma.like.findMany({
    where: { userId, trackId: { in: trackIds } },
    select: { trackId: true },
  });
  return new Set(rows.map((r) => r.trackId));
}
