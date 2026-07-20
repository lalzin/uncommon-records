import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, json, error } from "@/lib/auth";
import { publicUrl } from "@/lib/storage";

// Public promo page for a token-bound downloadable track.
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const user = await getCurrentUser(req);
  const invite = await prisma.inviteToken.findFirst({
    where: { token: params.token, inviteType: "promo_download" },
  });
  if (!invite || invite.used || invite.expiresAt <= new Date())
    return error("Invalid or expired promo link", 404);
  if (!invite.trackId) return error("Invalid promo link", 400);

  const track = await prisma.track.findUnique({
    where: { id: invite.trackId },
    include: { artist: true, _count: { select: { likes: true, comments: true } } },
  });
  if (!track) return error("Track not found", 404);
  if (!track.downloadable) return error("Download not allowed", 403);

  let liked = false;
  if (user)
    liked = !!(await prisma.like.findUnique({
      where: { unique_user_track_like: { userId: user.id, trackId: track.id } },
    }));

  return json({
    token: params.token,
    expires_at: invite.expiresAt.toISOString(),
    track: {
      id: track.id,
      title: track.title,
      genre: track.genre,
      bpm: track.bpm,
      key: track.key,
      description: track.description,
      duration: track.duration,
      like_count: track._count.likes,
      comment_count: track._count.comments,
      liked,
      cover_url: publicUrl(track.coverImage),
      preview_url: publicUrl(track.audioFile),
      download_url: `/api/tracks/promo-download/${params.token}`,
      spotify_url: track.spotifyUrl,
      soundcloud_url: track.soundcloudUrl,
      beatport_url: track.beatportUrl,
      artist: track.artist
        ? { id: track.artist.id, name: track.artist.name, bio: track.artist.bio }
        : null,
    },
  });
}
