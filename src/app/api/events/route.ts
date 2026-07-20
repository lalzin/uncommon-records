import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeEvent } from "@/lib/serializers";
import { allowedFile, saveImage, IMAGE_EXT } from "@/lib/storage";

// GET /api/events — published events, ascending by date.
export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get("limit");
  const events = await prisma.event.findMany({
    where: { isPublished: true },
    orderBy: { date: "asc" },
    ...(limit ? { take: Number(limit) } : {}),
  });
  return json({ events: events.map(serializeEvent) });
}

// POST /api/events — create (ADMIN).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) return error("Authentication required", 401);
  if (user.role !== "ADMIN") return error("Insufficient permissions", 403);

  const form = await req.formData();
  const dateStr = form.get("date");
  if (typeof dateStr !== "string" || !dateStr) return error("date required", 400);

  let imageUrl: string | null = null;
  const image = form.get("image");
  if (image instanceof File && image.name && allowedFile(image.name, IMAGE_EXT)) {
    imageUrl = await saveImage(image, "events", [1600, 900]);
  }

  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" && v !== "" ? v : null;
  };
  const lineupRaw = str("lineup");

  const event = await prisma.event.create({
    data: {
      title: str("title") || "Untitled Event",
      description: str("description"),
      date: new Date(dateStr),
      venue: str("venue"),
      location: str("location"),
      imageUrl,
      ticketUrl: str("ticket_url"),
      facebookUrl: str("facebook_url"),
      raUrl: str("ra_url"),
      lineup: lineupRaw ? JSON.parse(lineupRaw) : undefined,
      isPublished: (str("is_published") || "false").toLowerCase() === "true",
      isFeatured: (str("is_featured") || "false").toLowerCase() === "true",
    },
  });
  return json(serializeEvent(event), 201);
}
