export interface Artist {
  id: number;
  name: string;
  role: string;
  bio: string | null;
  avatar: string | null;
  social_links: Record<string, string>;
  track_count?: number;
}

export interface Track {
  id: number;
  title: string;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  description: string | null;
  cover_url: string | null;
  preview_url: string | null;
  duration: number | null;
  is_public: boolean;
  downloadable: boolean;
  play_count: number;
  download_count: number;
  like_count: number;
  comment_count: number;
  spotify_url: string | null;
  soundcloud_url: string | null;
  beatport_url: string | null;
  artist: Artist | null;
  liked: boolean;
}

export interface EventItem {
  id: number;
  title: string;
  description: string | null;
  date: string | null;
  venue: string | null;
  location: string | null;
  image_url: string | null;
  ticket_url: string | null;
  lineup: string[];
  is_featured: boolean;
}
