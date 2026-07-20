import { prisma } from "@/lib/prisma";
import { requireRole, json } from "@/lib/auth";
import { serializeSession } from "@/lib/serializers";

export const GET = requireRole("ADMIN")(async () => {
  const sessions = await prisma.session.findMany({
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return json({ sessions: sessions.map(serializeSession) });
});
