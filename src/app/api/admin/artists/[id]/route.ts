import { prisma } from "@/lib/prisma";
import { requireRole, json, error } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";
import { allowedFile, saveImage, deleteFile, IMAGE_EXT } from "@/lib/storage";

export const PUT = requireRole("ADMIN")(async (req, { params }) => {
  const id = Number(params.id);
  const artist = await prisma.user.findFirst({ where: { id, role: "ARTIST" } });
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
    if (str("is_active") !== undefined) update.isActive = str("is_active")!.toLowerCase() === "true";

    const existing = (artist.socialLinks as Record<string, string>) || {};
    const social: Record<string, string> = {};
    for (const key of ["instagram", "soundcloud", "beatport", "spotify"]) {
      social[key] = str(key) !== undefined ? str(key)! : existing[key] || "";
    }
    update.socialLinks = social;

    const avatarFile = form.get("avatar");
    if (avatarFile instanceof File && avatarFile.name && allowedFile(avatarFile.name, IMAGE_EXT)) {
      await deleteFile(artist.avatar);
      update.avatar = await saveImage(avatarFile, "avatars", [400, 400]);
    }
  } else {
    const data = await req.json().catch(() => ({}));
    if ("name" in data) update.name = data.name;
    if ("bio" in data) update.bio = data.bio;
    if ("is_active" in data) update.isActive = !!data.is_active;
    if ("social_links" in data) update.socialLinks = data.social_links;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: update,
    include: { _count: { select: { tracks: true } } },
  });
  return json({ ...serializeUser(updated, true), track_count: updated._count.tracks });
});

export const DELETE = requireRole("ADMIN")(async (_req, { params }) => {
  const id = Number(params.id);
  const artist = await prisma.user.findFirst({ where: { id, role: "ARTIST" } });
  if (!artist) return error("Not found", 404);
  await prisma.user.delete({ where: { id } });
  return json({ ok: true });
});
