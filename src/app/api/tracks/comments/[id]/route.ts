import { prisma } from "@/lib/prisma";
import { requireAuth, json, error } from "@/lib/auth";

export const DELETE = requireAuth(async (_req, { params, user }) => {
  const id = Number(params.id);
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return error("Not found", 404);
  if (comment.userId !== user.id && user.role !== "ADMIN") return error("Forbidden", 403);
  await prisma.comment.delete({ where: { id } });
  return json({ message: "Deleted" });
});
