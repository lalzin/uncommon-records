import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, json, error } from "@/lib/auth";
import { publicUrl } from "@/lib/storage";
import type { TrackWithRel } from "@/lib/serializers";

// Public promo page for a token-bound downloadable track.
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const user = await getCurrentUser(req);
  const { data: invite } = await supabase
    .from("invite_tokens")
    .select("*")
    .eq("token", params.token)
    .eq("invite_type", "promo_download")
    .maybeSingle();
  if (!invite || invite.used || new Date(invite.expires_at) <= new Date())
    return error("Invalid or expired promo link", 404);
  if (!invite.track_id) return error("Invalid promo link", 400);

  const { data } = await supabase
    .from("tracks")
    .select("*, artist:users!tracks_artist_id_fkey(*), likes(count), comments(count)")
    .eq("id", invite.track_id)
    .maybeSingle();
  const track = data as unknown as TrackWithRel | null;
  if (!track) return error("Track not found", 404);
  if (!track.downloadable) return error("Download not allowed", 403);

  let liked = false;
  if (user) {
    const { data: like } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("track_id", track.id)
      .maybeSingle();
    liked = !!like;
  }

  const likeCount = track.likes?.[0]?.count ?? 0;
  const commentCount = track.comments?.[0]?.count ?? 0;
  return json({
    token: params.token,
    expires_at: invite.expires_at,
    track: {
      id: track.id,
      title: track.title,
      genre: track.genre,
      bpm: track.bpm,
      key: track.key,
      description: track.description,
      duration: track.duration,
      like_count: likeCount,
      comment_count: commentCount,
      liked,
      cover_url: publicUrl(track.cover_image),
      preview_url: publicUrl(track.audio_file),
      download_url: `/api/tracks/promo-download/${params.token}`,
      spotify_url: track.spotify_url,
      soundcloud_url: track.soundcloud_url,
      beatport_url: track.beatport_url,
      artist: track.artist
        ? { id: track.artist.id, name: track.artist.name, bio: track.artist.bio }
        : null,
    },
  });
}
