import { prisma } from "@/lib/prisma";
import { requireRole, json } from "@/lib/auth";
import { serializeEvent } from "@/lib/serializers";

// All events incl. unpublished (ADMIN).
export const GET = requireRole("ADMIN")(async () => {
  const events = await prisma.event.findMany({ orderBy: { date: "asc" } });
  return json({ events: events.map(serializeEvent) });
});
