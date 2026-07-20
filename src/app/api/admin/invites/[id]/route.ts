import { prisma } from "@/lib/prisma";
import { requireRole, json, error } from "@/lib/auth";

export const DELETE = requireRole("ADMIN")(async (_req, { params }) => {
  const id = Number(params.id);
  if (!(await prisma.inviteToken.findUnique({ where: { id } }))) return error("Not found", 404);
  await prisma.inviteToken.delete({ where: { id } });
  return json({ ok: true });
});
