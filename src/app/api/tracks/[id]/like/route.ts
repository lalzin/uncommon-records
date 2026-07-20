import { prisma } from "@/lib/prisma";
import { requireAuth, json, error } from "@/lib/auth";

export const POST = requireAuth(async (_req, { params, user }) => {
  const trackId = Number(params.id);
  const track = await prisma.track.findUnique({ where: { id: trackId } });
  if (!track) return error("Not found", 404);

  const existing = await prisma.like.findUnique({
    where: { unique_user_track_like: { userId: user.id, trackId } },
  });
  let liked: boolean;
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    liked = false;
  } else {
    await prisma.like.create({ data: { userId: user.id, trackId } });
    liked = true;
  }
  const like_count = await prisma.like.count({ where: { trackId } });
  return json({ liked, like_count });
});
