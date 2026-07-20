import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, json } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

export const GET = requireAuth(async (_req, { user }) =>
  json(serializeUser(user, true)),
);

export const PUT = requireAuth(async (req, { user }) => {
  const data = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (typeof data.name === "string") update.name = data.name.trim();
  if ("bio" in data) update.bio = data.bio;
  if ("social_links" in data) update.socialLinks = data.social_links || {};

  const updated = await prisma.user.update({ where: { id: user.id }, data: update });
  return json(serializeUser(updated, true));
});
