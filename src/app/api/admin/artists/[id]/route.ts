import { supabase } from "@/lib/supabase";
import { requireRole, json, error } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";
import { allowedFile, saveImage, deleteFile, IMAGE_EXT } from "@/lib/storage";
import type { TableUpdate } from "@/lib/database.types";

export const PUT = requireRole("ADMIN")(async (req, { params }) => {
  const id = Number(params.id);
  const { data: artist } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .eq("role", "ARTIST")
    .maybeSingle();
  if (!artist) return error("Not found", 404);

  const update: Record<string, unknown> = {};
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart")) {
    const form = await req.formData();
    const str = (k: string) => {
      const v = form.get(k);
      return typeof v === "string" ? v : undefined;
    };
    if (str("name")) update.name = str("name")!.trim();
    if (str("bio") !== undefined) update.bio = str("bio");
    if (str("is_active") !== undefined) update.is_active = str("is_active")!.toLowerCase() === "true";

    const existing = (artist.social_links as Record<string, string>) || {};
    const social: Record<string, string> = {};
    for (const key of ["instagram", "soundcloud", "beatport", "spotify"]) {
      social[key] = str(key) !== undefined ? str(key)! : existing[key] || "";
    }
    update.social_links = social;

    const avatarFile = form.get("avatar");
    if (avatarFile instanceof File && avatarFile.name && allowedFile(avatarFile.name, IMAGE_EXT)) {
      await deleteFile(artist.avatar);
      update.avatar = await saveImage(avatarFile, "avatars", [400, 400]);
    }
  } else {
    const data = await req.json().catch(() => ({}));
    if ("name" in data) update.name = data.name;
    if ("bio" in data) update.bio = data.bio;
    if ("is_active" in data) update.is_active = !!data.is_active;
    if ("social_links" in data) update.social_links = data.social_links;
  }

  const { data: updated } = await supabase.from("users").update(update as TableUpdate<"users">).eq("id", id).select("*").single();
  const { count } = await supabase
    .from("tracks")
    .select("*", { count: "exact", head: true })
    .eq("artist_id", id);
  return json({ ...serializeUser(updated!, true), track_count: count ?? 0 });
});

export const DELETE = requireRole("ADMIN")(async (_req, { params }) => {
  const id = Number(params.id);
  const { data: artist } = await supabase
    .from("users")
    .select("id")
    .eq("id", id)
    .eq("role", "ARTIST")
    .maybeSingle();
  if (!artist) return error("Not found", 404);
  await supabase.from("users").delete().eq("id", id);
  return json({ ok: true });
});
