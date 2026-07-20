import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import type { Database } from "../src/lib/database.types";
import {
  buildYoutubeEmbedUrl,
  buildYoutubeThumbnailUrl,
} from "../src/lib/youtube";

// Seed via the Supabase service-role key (same as the app). Run: npm run db:seed
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants dans .env.local");
  process.exit(1);
}
const supabase = createClient<Database>(url, key, {
  auth: { persistSession: false },
});
const hash = (p: string) => bcrypt.hash(p, 12);

async function main() {
  // ── Admin ─────────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || "admin@uncommon-records.fr";
  const adminPassword = process.env.ADMIN_PASSWORD || "UncommonAdmin2024!";
  const { data: admin } = await supabase.from("users").select("id").eq("email", adminEmail).maybeSingle();
  if (!admin) {
    await supabase.from("users").insert({
      name: "Admin", email: adminEmail, role: "ADMIN", password_hash: await hash(adminPassword),
    });
    console.log(`✓ Admin created: ${adminEmail}`);
  } else {
    console.log("✓ Admin already exists");
  }

  const autoSeed = (process.env.AUTO_SEED_DEMO || "true").toLowerCase();
  const enabled = ["1", "true", "yes", "on"].includes(autoSeed);
  const [{ count: tc }, { count: ec }, { count: sc }] = await Promise.all([
    supabase.from("tracks").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("sessions").select("*", { count: "exact", head: true }),
  ]);
  if (!enabled || (tc ?? 0) + (ec ?? 0) + (sc ?? 0) > 0) {
    console.log("✓ Demo seed skipped (existing data or AUTO_SEED_DEMO disabled)");
    return;
  }

  // ── Artists ───────────────────────────────────────────────────────────────
  const socials = {
    instagram: "https://www.instagram.com/weareuncommonrecords/",
    soundcloud: "https://soundcloud.com/",
    beatport: "https://www.beatport.com/",
  };
  const artistsSeed = [
    { name: "Louis Bongo", email: "louis.bongo@uncommon-records.fr", bio: "DJ/Producteur house et afro house, membre du collectif Uncommon." },
    { name: "Joezi", email: "joezi@uncommon-records.fr", bio: "Signature du label entre groove house et textures afro." },
    { name: "Hydawai", email: "hydawai@uncommon-records.fr", bio: "Producteur mélodique et atmosphérique orienté dancefloor." },
  ];
  const artistByEmail: Record<string, number> = {};
  const artistHash = await hash("ArtistDemo2026!");
  for (const a of artistsSeed) {
    const { data: existing } = await supabase.from("users").select("id").eq("email", a.email).maybeSingle();
    if (existing) { artistByEmail[a.email] = existing.id; continue; }
    const { data: row } = await supabase
      .from("users")
      .insert({ name: a.name, email: a.email, role: "ARTIST", bio: a.bio, social_links: socials, password_hash: artistHash })
      .select("id")
      .single();
    artistByEmail[a.email] = row!.id;
  }

  // ── Tracks ────────────────────────────────────────────────────────────────
  const trackSeed = [
    { title: "Georgy Porgy", genre: "Afro House", bpm: 124, key: "A minor", description: "Bensy & Serve Cold & Grigoré — release Uncommon.", audio: "https://samplelib.com/lib/preview/mp3/sample-3s.mp3", spotify: "https://open.spotify.com/intl-fr/track/4qvIafWqMySjIcs4BXRxhh", email: "louis.bongo@uncommon-records.fr" },
    { title: "Can't Break a Heart", genre: "House", bpm: 126, key: "C minor", description: "Joezi & Asher Swissa — release Uncommon.", audio: "https://samplelib.com/lib/preview/mp3/sample-6s.mp3", spotify: "https://open.spotify.com/intl-fr/track/6pYTJJlHRar2jLm7PCrQsV", email: "joezi@uncommon-records.fr" },
    { title: "Calypso", genre: "Tech House", bpm: 127, key: "F# minor", description: "Louis Bongo — release Uncommon.", audio: "https://samplelib.com/lib/preview/mp3/sample-9s.mp3", spotify: "https://open.spotify.com/intl-fr/track/5IMfr4cTrSqrVDbnHCuMCT", email: "louis.bongo@uncommon-records.fr" },
    { title: "A Globo", genre: "Afro House", bpm: 123, key: "D minor", description: "Eddy de Mart & Galbinus — release Uncommon.", audio: "https://samplelib.com/lib/preview/mp3/sample-12s.mp3", spotify: "https://open.spotify.com/intl-fr/track/7JFitmFChdmRnv0SspKtr6", email: "hydawai@uncommon-records.fr" },
  ];
  for (const t of trackSeed) {
    const { data: existing } = await supabase.from("tracks").select("id").eq("title", t.title).maybeSingle();
    if (existing) continue;
    await supabase.from("tracks").insert({
      title: t.title, genre: t.genre, bpm: t.bpm, key: t.key, description: t.description,
      audio_file: t.audio, duration: 30, is_public: true, downloadable: false,
      spotify_url: t.spotify, soundcloud_url: "https://soundcloud.com/", beatport_url: "https://www.beatport.com/",
      artist_id: artistByEmail[t.email],
    });
  }

  // ── Events ────────────────────────────────────────────────────────────────
  const now = Date.now();
  const day = 86400_000;
  const iso = (ms: number) => new Date(ms).toISOString();
  const eventsSeed = [
    { title: "WE ARE UNCOMMON « Mesmerizing »", description: "Une nuit hors du temps dédiée aux vibrations Afro House, House et Tech House.", date: iso(now + 260 * day), venue: "Glaz Arena", location: "Cesson-Sévigné", lineup: ["Adassiya", "Bayé", "Elliot Schooling & Liam Palmer", "Joezi", "Juntaro", "Louis Bongo", "Olive F"], is_featured: true },
    { title: "UNCOMMON Open Air", description: "Grand format Open Air au Château d'Apigné.", date: iso(now + 120 * day), venue: "Château d'Apigné", location: "Le Rheu", lineup: ["Louis Bongo", "Joezi", "Hydawai"], is_featured: false },
    { title: "Label Night x Serpentale", description: "Édition spéciale Label Night.", date: iso(now - 150 * day), venue: "ADE", location: "Amsterdam", lineup: ["Uncommon Crew", "Serpentale"], is_featured: false },
    { title: "WE ARE UNCOMMON — Château d'Apigné", description: "Événement summer format au Château d'Apigné.", date: iso(now - 420 * day), venue: "Château d'Apigné", location: "Le Rheu", lineup: ["Louis Bongo", "Guests"], is_featured: false },
  ];
  for (const e of eventsSeed) {
    const { data: existing } = await supabase.from("events").select("id").eq("title", e.title).maybeSingle();
    if (existing) continue;
    await supabase.from("events").insert({
      title: e.title, description: e.description, date: e.date, venue: e.venue, location: e.location,
      ticket_url: "https://www.instagram.com/weareuncommonrecords/",
      facebook_url: "https://www.facebook.com/weareuncommonrecords/",
      ra_url: "https://ra.co/", lineup: e.lineup, is_published: true, is_featured: e.is_featured,
    });
  }

  // ── Sessions ────────────────────────────────────────────────────────────────
  const sessionsSeed = [
    { title: "Uncommon Session 001", description: "Session vidéo immersive autour de l'esthétique afro house du label.", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", is_featured: true, sort_order: 1 },
    { title: "Uncommon Session 002", description: "Set capté dans un format brut et nocturne, pensé pour la promo.", url: "https://www.youtube.com/watch?v=ysz5S6PUM-U", is_featured: false, sort_order: 2 },
  ];
  for (const s of sessionsSeed) {
    const { data: existing } = await supabase.from("sessions").select("id").eq("title", s.title).maybeSingle();
    if (existing) continue;
    await supabase.from("sessions").insert({
      title: s.title, description: s.description, youtube_url: s.url,
      embed_url: buildYoutubeEmbedUrl(s.url)!, thumbnail_url: buildYoutubeThumbnailUrl(s.url),
      is_published: true, is_featured: s.is_featured, sort_order: s.sort_order,
    });
  }

  console.log("✓ Demo content seeded (artists, tracks, events, sessions)");
}

main().catch((e) => { console.error(e); process.exit(1); });
