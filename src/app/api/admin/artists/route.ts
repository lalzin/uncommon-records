import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword, json, error } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";
import { allowedFile, saveImage, IMAGE_EXT } from "@/lib/storage";

export const GET = requireRole("ADMIN")(async () => {
  const artists = await prisma.user.findMany({
    where: { role: "ARTIST" },
    orderBy: { name: "asc" },
    include: { _count: { select: { tracks: true } } },
  });
  const result = artists.map((a) => ({
    ...serializeUser(a, true),
    track_count: a._count.tracks,
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
  if (await prisma.user.findUnique({ where: { email } }))
    return error("Email already in use", 409);

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
  const artist = await prisma.user.create({
    data: {
      name,
      email,
      role: "ARTIST",
      bio: str("bio"),
      socialLinks,
      isActive: true,
      avatar,
      passwordHash: await hashPassword(password),
    },
  });
  return json(serializeUser(artist, true), 201);
});
