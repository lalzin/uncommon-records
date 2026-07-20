import { randomBytes } from "crypto";
import { supabase } from "@/lib/supabase";
import { requireRole, hashPassword, json, error } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";
import { allowedFile, saveImage, IMAGE_EXT } from "@/lib/storage";

export const GET = requireRole("ADMIN")(async () => {
  const { data: artists } = await supabase
    .from("users")
    .select("*")
    .eq("role", "ARTIST")
    .order("name", { ascending: true });

  const ids = (artists ?? []).map((a) => a.id);
  const counts = new Map<number, number>();
  if (ids.length) {
    const { data: tracks } = await supabase.from("tracks").select("artist_id").in("artist_id", ids);
    for (const t of tracks ?? []) counts.set(t.artist_id, (counts.get(t.artist_id) ?? 0) + 1);
  }

  const result = (artists ?? []).map((a) => ({
    ...serializeUser(a, true),
    track_count: counts.get(a.id) ?? 0,
  }));
  return json({ artists: result });
});

// Create an artist directly (no invite flow).
export const POST = requireRole("ADMIN")(async (req) => {
  const form = await req.formData();
  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v.trim() : "";
  };
  const name = str("name");
  const email = str("email").toLowerCase();
  if (!name || !email) return error("name and email are required", 400);

  const { data: existing } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  if (existing) return error("Email already in use", 409);

  const socialLinks = {
    instagram: str("instagram"),
    soundcloud: str("soundcloud"),
    beatport: str("beatport"),
    spotify: str("spotify"),
  };

  let avatar: string | null = null;
  const avatarFile = form.get("avatar");
  if (avatarFile instanceof File && avatarFile.name && allowedFile(avatarFile.name, IMAGE_EXT)) {
    avatar = await saveImage(avatarFile, "avatars", [400, 400]);
  }

  const password = str("password") || randomBytes(16).toString("base64url");
  const { data: artist, error: insErr } = await supabase
    .from("users")
    .insert({
      name,
      email,
      role: "ARTIST",
      bio: str("bio"),
      social_links: socialLinks,
      is_active: true,
      avatar,
      password_hash: await hashPassword(password),
    })
    .select("*")
    .single();
  if (insErr || !artist) return error(insErr?.message || "Create failed", 500);

  return json(serializeUser(artist, true), 201);
});
