import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, json, error } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

export const PUT = requireRole("ADMIN")(async (req, { params }) => {
  const id = Number(params.id);
  if (!(await prisma.user.findUnique({ where: { id } }))) return error("Not found", 404);

  const data = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (["USER", "ARTIST", "ADMIN"].includes(data.role)) update.role = data.role as Role;
  if ("is_active" in data) update.isActive = !!data.is_active;

  const user = await prisma.user.update({ where: { id }, data: update });
  return json(serializeUser(user, true));
});
