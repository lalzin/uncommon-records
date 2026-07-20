// Hand-authored Supabase types.
// IMPORTANT: use `type` everywhere, NOT `interface` — with `interface` the typed
// supabase-js client collapses to `never` (insert/update payloads become never[]).

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Role = "USER" | "ARTIST" | "ADMIN";

type Timestamps = { created_at: string; updated_at: string };

export type UserRow = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  bio: string | null;
  avatar: string | null;
  social_links: Json | null;
  is_active: boolean;
} & Timestamps;

export type TrackRow = {
  id: number;
  title: string;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  description: string | null;
  cover_image: string | null;
  audio_file: string;
  duration: number | null;
  is_public: boolean;
  downloadable: boolean;
  play_count: number;
  download_count: number;
  spotify_url: string | null;
  soundcloud_url: string | null;
  beatport_url: string | null;
  artist_id: number;
} & Timestamps;

export type EventRow = {
  id: number;
  title: string;
  description: string | null;
  date: string;
  venue: string | null;
  location: string | null;
  image_url: string | null;
  ticket_url: string | null;
  facebook_url: string | null;
  ra_url: string | null;
  lineup: Json | null;
  is_published: boolean;
  is_featured: boolean;
} & Timestamps;

export type SessionRow = {
  id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  embed_url: string;
  thumbnail_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
} & Timestamps;

export type CommentRow = {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  track_id: number;
  parent_id: number | null;
};

export type LikeRow = {
  id: number;
  created_at: string;
  user_id: number;
  track_id: number;
};

export type DownloadRow = {
  id: number;
  created_at: string;
  ip_address: string | null;
  user_id: number | null;
  track_id: number;
};

export type InviteTokenRow = {
  id: number;
  token: string;
  email: string | null;
  invite_type: string;
  used: boolean;
  used_by_email: string | null;
  expires_at: string;
  created_at: string;
  track_id: number | null;
  created_by: number | null;
};

// Insert = required business fields, DB-defaulted columns optional.
type InsertOf<Row, Optional extends keyof Row> = Omit<Row, Optional | keyof Timestamps> &
  Partial<Pick<Row, Extract<Optional, keyof Row>>> &
  Partial<Timestamps>;

type Table<Row, Optional extends keyof Row> = {
  Row: Row;
  Insert: InsertOf<Row, Optional>;
  Update: Partial<InsertOf<Row, Optional>>;
  Relationships: [];
};

type IdCreated = "id" | "created_at";

export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Database = {
  public: {
    Tables: {
      users: Table<UserRow, "id" | "role" | "bio" | "avatar" | "social_links" | "is_active">;
      tracks: Table<
        TrackRow,
        | "id"
        | "genre"
        | "bpm"
        | "key"
        | "description"
        | "cover_image"
        | "duration"
        | "is_public"
        | "downloadable"
        | "play_count"
        | "download_count"
        | "spotify_url"
        | "soundcloud_url"
        | "beatport_url"
      >;
      events: Table<
        EventRow,
        | "id"
        | "description"
        | "venue"
        | "location"
        | "image_url"
        | "ticket_url"
        | "facebook_url"
        | "ra_url"
        | "lineup"
        | "is_published"
        | "is_featured"
      >;
      sessions: Table<
        SessionRow,
        "id" | "description" | "thumbnail_url" | "is_published" | "is_featured" | "sort_order"
      >;
      comments: Table<CommentRow, IdCreated | "parent_id">;
      likes: Table<LikeRow, IdCreated>;
      downloads: Table<DownloadRow, IdCreated | "ip_address" | "user_id">;
      invite_tokens: Table<
        InviteTokenRow,
        IdCreated | "email" | "invite_type" | "used" | "used_by_email" | "track_id" | "created_by"
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { Role: Role };
  };
};
