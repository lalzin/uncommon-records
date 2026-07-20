import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeEvent } from "@/lib/serializers";
import { allowedFile, saveImage, deleteFile, IMAGE_EXT } from "@/lib/storage";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const event = await prisma.event.findUnique({ where: { id: Number(params.id) } });
  if (!event) return error("Not found", 404);
  const user = await getCurrentUser(req);
  if (!event.isPublished && !(user && user.role === "ADMIN")) return error("Not found", 404);
  return json(serializeEvent(event));
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) return error("Authentication required", 401);
  if (user.role !== "ADMIN") return error("Insufficient permissions", 403);

  const id = Number(params.id);
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return error("Not found", 404);

  const form = await req.formData();
  const update: Record<string, unknown> = {};

  const image = form.get("image");
  if (image instanceof File && image.name && allowedFile(image.name, IMAGE_EXT)) {
    await deleteFile(event.imageUrl);
    update.imageUrl = await saveImage(image, "events", [1600, 900]);
  }

  const map: Record<string, string> = {
    title: "title", description: "description", venue: "venue", location: "location",
    ticket_url: "ticketUrl", facebook_url: "facebookUrl", ra_url: "raUrl",
  };
  for (const [formKey, col] of Object.entries(map)) {
    const v = form.get(formKey);
    if (typeof v === "string") update[col] = v;
  }
  const lineup = form.get("lineup");
  if (typeof lineup === "string") update.lineup = lineup ? JSON.parse(lineup) : [];
  const date = form.get("date");
  if (typeof date === "string" && date) update.date = new Date(date);
  const isPublished = form.get("is_published");
  if (typeof isPublished === "string") update.isPublished = isPublished.toLowerCase() === "true";
  const isFeatured = form.get("is_featured");
  if (typeof isFeatured === "string") update.isFeatured = isFeatured.toLowerCase() === "true";

  const updated = await prisma.event.update({ where: { id }, data: update });
  return json(serializeEvent(updated));
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) return error("Authentication required", 401);
  if (user.role !== "ADMIN") return error("Insufficient permissions", 403);

  const id = Number(params.id);
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return error("Not found", 404);
  await deleteFile(event.imageUrl);
  await prisma.event.delete({ where: { id } });
  return json({ message: "Deleted" });
}
