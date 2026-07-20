import { prisma } from "@/lib/prisma";
import { requireRole, json } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

export const GET = requireRole("ADMIN")(async () => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return json(users.map((u) => serializeUser(u, true)));
});
