import { publicUrl } from "./storage";
import type {
  UserRow,
  TrackRow,
  EventRow,
  SessionRow,
  CommentRow,
  InviteTokenRow,
} from "./database.types";

type Count = { count: number }[];

// ── User ──────────────────────────────────────────────────────────────────────
export type UserWithCount = UserRow & { track_count?: number };

export function serializeUser(u: UserWithCount, includePrivate = false) {
  const data: Record<string, unknown> = {
    id: u.id,
    name: u.name,
    role: u.role,
    bio: u.bio,
    avatar: publicUrl(u.avatar),
    social_links: u.social_links ?? {},
    created_at: u.created_at ?? null,
  };
  if (includePrivate) {
    data.email = u.email;
    data.is_active = u.is_active;
  }
  if (u.track_count !== undefined) data.track_count = u.track_count;
  return data;
}

// ── Track ─────────────────────────────────────────────────────────────────────
export type TrackWithRel = TrackRow & {
  artist: UserRow | null;
  likes: Count;
  comments: Count;
};

const countOf = (c: Count | undefined) => (c && c[0] ? c[0].count : 0);

export function serializeTrack(t: TrackWithRel, liked = false) {
  return {
    id: t.id,
    title: t.title,
    genre: t.genre,
    bpm: t.bpm,
    key: t.key,
    description: t.description,
    cover_image: t.cover_image,
    cover_url: publicUrl(t.cover_image),
    preview_url: publicUrl(t.audio_file),
    duration: t.duration,
    is_public: t.is_public,
    downloadable: t.downloadable,
    play_count: t.play_count,
    download_count: t.download_count,
    like_count: countOf(t.likes),
    comment_count: countOf(t.comments),
    spotify_url: t.spotify_url,
    soundcloud_url: t.soundcloud_url,
    beatport_url: t.beatport_url,
    artist: t.artist ? serializeUser(t.artist) : null,
    liked,
    created_at: t.created_at ?? null,
  };
}

// ── Event ─────────────────────────────────────────────────────────────────────
export function serializeEvent(e: EventRow) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date ?? null,
    venue: e.venue,
    location: e.location,
    image_url: publicUrl(e.image_url),
    ticket_url: e.ticket_url,
    facebook_url: e.facebook_url,
    ra_url: e.ra_url,
    lineup: Array.isArray(e.lineup) ? e.lineup : [],
    is_published: e.is_published,
    is_featured: e.is_featured,
    created_at: e.created_at ?? null,
  };
}

// ── Session ───────────────────────────────────────────────────────────────────
export function serializeSession(s: SessionRow) {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    youtube_url: s.youtube_url,
    embed_url: s.embed_url,
    thumbnail_url: s.thumbnail_url,
    is_published: s.is_published,
    is_featured: s.is_featured,
    sort_order: s.sort_order,
    created_at: s.created_at ?? null,
    updated_at: s.updated_at ?? null,
  };
}

// ── Comment ───────────────────────────────────────────────────────────────────
export type CommentWithRel = CommentRow & {
  user: UserRow | null;
  replies: Count;
};

export function serializeComment(c: CommentWithRel) {
  return {
    id: c.id,
    content: c.content,
    user: c.user ? serializeUser(c.user) : null,
    parent_id: c.parent_id,
    reply_count: countOf(c.replies),
    created_at: c.created_at ?? null,
  };
}

// ── InviteToken ───────────────────────────────────────────────────────────────
export function serializeInvite(i: InviteTokenRow) {
  return {
    id: i.id,
    token: i.token,
    email: i.email,
    invite_type: i.invite_type,
    track_id: i.track_id,
    used: i.used,
    used_by_email: i.used_by_email,
    expires_at: i.expires_at ?? null,
    created_at: i.created_at ?? null,
  };
}
