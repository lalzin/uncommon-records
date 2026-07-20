import { prisma } from "@/lib/prisma";
import { requireRole, json, error } from "@/lib/auth";
import { presignDownload } from "@/lib/storage";

// Authenticated download. Logs the download and returns a direct/presigned URL.
export const GET = requireRole("ADMIN", "ARTIST", "USER")(async (req, { params, user }) => {
  const track = await prisma.track.findUnique({ where: { id: Number(params.id) } });
  if (!track) return error("Not found", 404);
  if (!track.downloadable) return error("Download not allowed", 403);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? null;
  await prisma.$transaction([
    prisma.download.create({ data: { userId: user.id, trackId: track.id, ipAddress: ip } }),
    prisma.track.update({ where: { id: track.id }, data: { downloadCount: { increment: 1 } } }),
  ]);

  const filename = `${track.title.replace(/ /g, "_")}.${track.audioFile.split(".").pop()}`;
  if (track.audioFile.startsWith("http"))
    return json({ direct_url: track.audioFile, filename });
  return json({ direct_url: await presignDownload(track.audioFile, filename), filename });
});
