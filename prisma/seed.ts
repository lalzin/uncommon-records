import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { buildYoutubeEmbedUrl, buildYoutubeThumbnailUrl } from "../src/lib/youtube";

const prisma = new PrismaClient();
const hash = (p: string) => bcrypt.hash(p, 12);

async function main() {
  // ── Default admin ───────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || "admin@uncommon-records.fr";
  const adminPassword = process.env.ADMIN_PASSWORD || "UncommonAdmin2024!";
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    await prisma.user.create({
      data: { name: "Admin", email: adminEmail, role: "ADMIN", passwordHash: await hash(adminPassword) },
    });
    console.log(`✓ Admin created: ${adminEmail}`);
  } else {
    console.log("✓ Admin already exists");
  }

  const autoSeed = (process.env.AUTO_SEED_DEMO || "true").toLowerCase();
  const shouldSeed =
    ["1", "true", "yes", "on"].includes(autoSeed) &&
    (await prisma.track.count()) === 0 &&
    (await prisma.event.count()) === 0 &&
    (await prisma.session.count()) === 0;

  if (!shouldSeed) {
    console.log("✓ Demo seed skipped (existing data or AUTO_SEED_DEMO disabled)");
    return;
  }

  // ── Artists ─────────────────────────────────────────────────────────────────
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
  for (const a of artistsSeed) {
    const existing = await prisma.user.findUnique({ where: { email: a.email } });
    const row =
      existing ??
      (await prisma.user.create({
        data: {
          name: a.name,
          email: a.email,
          role: "ARTIST",
          bio: a.bio,
          socialLinks: socials,
          passwordHash: await hash("ArtistDemo2026!"),
        },
      }));
    artistByEmail[a.email] = row.id;
  }

  // ── Tracks ──────────────────────────────────────────────────────────────────
  const trackSeed = [
    { title: "Georgy Porgy", genre: "Afro House", bpm: 124, key: "A minor", description: "Bensy & Serve Cold & Grigoré — release Uncommon.", audio: "https://samplelib.com/lib/preview/mp3/sample-3s.mp3", spotify: "https://open.spotify.com/intl-fr/track/4qvIafWqMySjIcs4BXRxhh", email: "louis.bongo@uncommon-records.fr" },
    { title: "Can't Break a Heart", genre: "House", bpm: 126, key: "C minor", description: "Joezi & Asher Swissa — release Uncommon.", audio: "https://samplelib.com/lib/preview/mp3/sample-6s.mp3", spotify: "https://open.spotify.com/intl-fr/track/6pYTJJlHRar2jLm7PCrQsV", email: "joezi@uncommon-records.fr" },
    { title: "Calypso", genre: "Tech House", bpm: 127, key: "F# minor", description: "Louis Bongo — release Uncommon.", audio: "https://samplelib.com/lib/preview/mp3/sample-9s.mp3", spotify: "https://open.spotify.com/intl-fr/track/5IMfr4cTrSqrVDbnHCuMCT", email: "louis.bongo@uncommon-records.fr" },
    { title: "A Globo", genre: "Afro House", bpm: 123, key: "D minor", description: "Eddy de Mart & Galbinus — release Uncommon.", audio: "https://samplelib.com/lib/preview/mp3/sample-12s.mp3", spotify: "https://open.spotify.com/intl-fr/track/7JFitmFChdmRnv0SspKtr6", email: "hydawai@uncommon-records.fr" },
  ];
  for (const t of trackSeed) {
    if (await prisma.track.findFirst({ where: { title: t.title } })) continue;
    await prisma.track.create({
      data: {
        title: t.title, genre: t.genre, bpm: t.bpm, key: t.key, description: t.description,
        audioFile: t.audio, duration: 30, isPublic: true, downloadable: false,
        spotifyUrl: t.spotify, soundcloudUrl: "https://soundcloud.com/", beatportUrl: "https://www.beatport.com/",
        artistId: artistByEmail[t.email],
      },
    });
  }

  // ── Events ──────────────────────────────────────────────────────────────────
  const now = Date.now();
  const day = 86400_000;
  const eventsSeed = [
    { title: "WE ARE UNCOMMON « Mesmerizing »", description: "Une nuit hors du temps dédiée aux vibrations Afro House, House et Tech House.", date: new Date(now + 260 * day), venue: "Glaz Arena", location: "Cesson-Sévigné", lineup: ["Adassiya", "Bayé", "Elliot Schooling & Liam Palmer", "Joezi", "Juntaro", "Louis Bongo", "Olive F"], isFeatured: true },
    { title: "UNCOMMON Open Air", description: "Grand format Open Air au Château d'Apigné.", date: new Date(now + 120 * day), venue: "Château d'Apigné", location: "Le Rheu", lineup: ["Louis Bongo", "Joezi", "Hydawai"], isFeatured: false },
    { title: "Label Night x Serpentale", description: "Édition spéciale Label Night.", date: new Date(now - 150 * day), venue: "ADE", location: "Amsterdam", lineup: ["Uncommon Crew", "Serpentale"], isFeatured: false },
    { title: "WE ARE UNCOMMON — Château d'Apigné", description: "Événement summer format au Château d'Apigné.", date: new Date(now - 420 * day), venue: "Château d'Apigné", location: "Le Rheu", lineup: ["Louis Bongo", "Guests"], isFeatured: false },
  ];
  for (const e of eventsSeed) {
    if (await prisma.event.findFirst({ where: { title: e.title } })) continue;
    await prisma.event.create({
      data: {
        title: e.title, description: e.description, date: e.date, venue: e.venue, location: e.location,
        ticketUrl: "https://www.instagram.com/weareuncommonrecords/",
        facebookUrl: "https://www.facebook.com/weareuncommonrecords/",
        raUrl: "https://ra.co/", lineup: e.lineup, isPublished: true, isFeatured: e.isFeatured,
      },
    });
  }

  // ── Sessions ──────────────────────────────────────────────────────────────────
  const sessionsSeed = [
    { title: "Uncommon Session 001", description: "Session vidéo immersive autour de l'esthétique afro house du label.", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", isFeatured: true, sortOrder: 1 },
    { title: "Uncommon Session 002", description: "Set capté dans un format brut et nocturne, pensé pour la promo.", url: "https://www.youtube.com/watch?v=ysz5S6PUM-U", isFeatured: false, sortOrder: 2 },
  ];
  for (const s of sessionsSeed) {
    if (await prisma.session.findFirst({ where: { title: s.title } })) continue;
    await prisma.session.create({
      data: {
        title: s.title, description: s.description, youtubeUrl: s.url,
        embedUrl: buildYoutubeEmbedUrl(s.url)!, thumbnailUrl: buildYoutubeThumbnailUrl(s.url),
        isPublished: true, isFeatured: s.isFeatured, sortOrder: s.sortOrder,
      },
    });
  }

  console.log("✓ Demo content seeded (artists, tracks, events, sessions)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
