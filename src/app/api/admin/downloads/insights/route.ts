import { prisma } from "@/lib/prisma";
import { requireRole, json } from "@/lib/auth";

export const GET = requireRole("ADMIN")(async (req) => {
  const raw = Number(req.nextUrl.searchParams.get("limit")) || 30;
  const limit = Math.max(1, Math.min(raw, 100));

  const recent = await prisma.download.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { track: { include: { artist: true } }, user: true },
  });
  const recent_downloads = recent.map((d) => ({
    id: d.id,
    created_at: d.createdAt?.toISOString() ?? null,
    ip_address: d.ipAddress,
    track: d.track
      ? { id: d.track.id, title: d.track.title, artist_name: d.track.artist?.name ?? null }
      : null,
    downloader: d.user
      ? { id: d.user.id, name: d.user.name, email: d.user.email, role: d.user.role }
      : null,
  }));

  // Top tracks by download count.
  const topTrackGroups = await prisma.download.groupBy({
    by: ["trackId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });
  const topTrackRows = await prisma.track.findMany({
    where: { id: { in: topTrackGroups.map((g) => g.trackId) } },
    include: { artist: true },
  });
  const trackMap = new Map(topTrackRows.map((t) => [t.id, t]));
  const top_tracks = topTrackGroups.map((g) => {
    const t = trackMap.get(g.trackId);
    return {
      track_id: g.trackId,
      title: t?.title ?? null,
      artist_name: t?.artist?.name ?? null,
      downloads_count: g._count.id,
    };
  });

  // Top downloaders (registered users only).
  const topUserGroups = await prisma.download.groupBy({
    by: ["userId"],
    where: { userId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });
  const userRows = await prisma.user.findMany({
    where: { id: { in: topUserGroups.map((g) => g.userId!).filter(Boolean) } },
  });
  const userMap = new Map(userRows.map((u) => [u.id, u]));
  const top_downloaders = topUserGroups.map((g) => {
    const u = userMap.get(g.userId!);
    return {
      user_id: g.userId,
      name: u?.name ?? null,
      email: u?.email ?? null,
      role: u?.role ?? null,
      downloads_count: g._count.id,
    };
  });

  return json({ recent_downloads, top_tracks, top_downloaders });
});
