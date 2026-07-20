import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { error } from "@/lib/auth";
import { presignDownload } from "@/lib/storage";

// Anonymous download via promo token. Logs the download and 302-redirects to the file.
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const invite = await prisma.inviteToken.findFirst({
    where: { token: params.token, inviteType: "promo_download" },
  });
  if (!invite || invite.used || invite.expiresAt <= new Date())
    return error("Invalid or expired promo link", 404);
  if (!invite.trackId) return error("Invalid promo link", 400);

  const track = await prisma.track.findUnique({ where: { id: invite.trackId } });
  if (!track) return error("Track not found", 404);
  if (!track.downloadable) return error("Download not allowed", 403);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? null;
  await prisma.$transaction([
    prisma.download.create({ data: { userId: null, trackId: track.id, ipAddress: ip } }),
    prisma.track.update({ where: { id: track.id }, data: { downloadCount: { increment: 1 } } }),
  ]);

  const filename = `${track.title.replace(/ /g, "_")}.${track.audioFile.split(".").pop()}`;
  const url = track.audioFile.startsWith("http")
    ? track.audioFile
    : await presignDownload(track.audioFile, filename);
  return NextResponse.redirect(url, 302);
}
