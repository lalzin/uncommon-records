import type { Prisma, User } from "@prisma/client";
import { publicUrl } from "./storage";

// ── User ──────────────────────────────────────────────────────────────────────
type UserWithMaybeCount = User & { _count?: { tracks?: number } };

export function serializeUser(u: UserWithMaybeCount, includePrivate = false) {
  const data: Record<string, unknown> = {
    id: u.id,
    name: u.name,
    role: u.role,
    bio: u.bio,
    avatar: publicUrl(u.avatar),
    social_links: u.socialLinks ?? {},
    created_at: u.createdAt?.toISOString() ?? null,
  };
  if (includePrivate) {
    data.email = u.email;
    data.is_active = u.isActive;
  }
  return data;
}

// ── Track ─────────────────────────────────────────────────────────────────────
type TrackPayload = Prisma.TrackGetPayload<{
  include: { artist: true; _count: { select: { likes: true; comments: true } } };
}>;

export function serializeTrack(t: TrackPayload, liked = false) {
  return {
    id: t.id,
    title: t.title,
    genre: t.genre,
    bpm: t.bpm,
    key: t.key,
    description: t.description,
    cover_image: t.coverImage,
    cover_url: publicUrl(t.coverImage),
    preview_url: publicUrl(t.audioFile),
    duration: t.duration,
    is_public: t.isPublic,
    downloadable: t.downloadable,
    play_count: t.playCount,
    download_count: t.downloadCount,
    like_count: t._count.likes,
    comment_count: t._count.comments,
    spotify_url: t.spotifyUrl,
    soundcloud_url: t.soundcloudUrl,
    beatport_url: t.beatportUrl,
    artist: t.artist ? serializeUser(t.artist) : null,
    liked,
    created_at: t.createdAt?.toISOString() ?? null,
  };
}

// ── Event ─────────────────────────────────────────────────────────────────────
export function serializeEvent(e: Prisma.EventGetPayload<object>) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date?.toISOString() ?? null,
    venue: e.venue,
    location: e.location,
    image_url: publicUrl(e.imageUrl),
    ticket_url: e.ticketUrl,
    facebook_url: e.facebookUrl,
    ra_url: e.raUrl,
    lineup: Array.isArray(e.lineup) ? e.lineup : [],
    is_published: e.isPublished,
    is_featured: e.isFeatured,
    created_at: e.createdAt?.toISOString() ?? null,
  };
}

// ── Session ───────────────────────────────────────────────────────────────────
export function serializeSession(s: Prisma.SessionGetPayload<object>) {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    youtube_url: s.youtubeUrl,
    embed_url: s.embedUrl,
    thumbnail_url: s.thumbnailUrl,
    is_published: s.isPublished,
    is_featured: s.isFeatured,
    sort_order: s.sortOrder,
    created_at: s.createdAt?.toISOString() ?? null,
    updated_at: s.updatedAt?.toISOString() ?? null,
  };
}

// ── Comment ───────────────────────────────────────────────────────────────────
type CommentPayload = Prisma.CommentGetPayload<{
  include: { user: true; _count: { select: { replies: true } } };
}>;

export function serializeComment(c: CommentPayload) {
  return {
    id: c.id,
    content: c.content,
    user: c.user ? serializeUser(c.user) : null,
    parent_id: c.parentId,
    reply_count: c._count.replies,
    created_at: c.createdAt?.toISOString() ?? null,
  };
}

// ── InviteToken ───────────────────────────────────────────────────────────────
export function serializeInvite(i: Prisma.InviteTokenGetPayload<object>) {
  return {
    id: i.id,
    token: i.token,
    email: i.email,
    invite_type: i.inviteType,
    track_id: i.trackId,
    used: i.used,
    used_by_email: i.usedByEmail,
    expires_at: i.expiresAt?.toISOString() ?? null,
    created_at: i.createdAt?.toISOString() ?? null,
  };
}
