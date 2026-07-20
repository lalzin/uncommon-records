import { prisma } from "@/lib/prisma";
import { requireRole, json } from "@/lib/auth";

export const GET = requireRole("ADMIN")(async () => {
  const [users, artists, tracks, events, sessions, likes, downloads, comments] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ARTIST" } }),
      prisma.track.count(),
      prisma.event.count(),
      prisma.session.count(),
      prisma.like.count(),
      prisma.download.count(),
      prisma.comment.count(),
    ]);
  return json({ users, artists, tracks, events, sessions, likes, downloads, comments });
});
