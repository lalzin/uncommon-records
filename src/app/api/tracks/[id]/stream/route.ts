import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, error } from "@/lib/auth";
import { publicUrl } from "@/lib/storage";

// Returns a playable URL. Audio lives in the object store (or a remote demo URL).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const track = await prisma.track.findUnique({ where: { id: Number(params.id) } });
  if (!track) return error("Not found", 404);
  if (!track.isPublic) return error("Not found", 404);
  return json({ stream_url: publicUrl(track.audioFile) });
}
