import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, error } from "@/lib/auth";
import { serializeUser, serializeTrack } from "@/lib/serializers";
import { trackInclude } from "@/lib/trackInclude";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const artist = await prisma.user.findFirst({
    where: { id: Number(params.id), role: "ARTIST" },
  });
  if (!artist) return error("Not found", 404);

  const tracks = await prisma.track.findMany({
    where: { artistId: artist.id, isPublic: true },
    include: trackInclude,
    orderBy: { createdAt: "desc" },
  });
  return json({
    artist: serializeUser(artist),
    tracks: tracks.map((t) => serializeTrack(t)),
  });
}
