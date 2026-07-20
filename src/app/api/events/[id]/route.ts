import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeEvent } from "@/lib/serializers";
import { allowedFile, saveImage, deleteFile, IMAGE_EXT } from "@/lib/storage";
import type { TableUpdate } from "@/lib/database.types";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { data: event } = await supabase.from("events").select("*").eq("id", Number(params.id)).maybeSingle();
  if (!event) return error("Not found", 404);
  const user = await getCurrentUser(req);
  if (!event.is_published && !(user && user.role === "ADMIN")) return error("Not found", 404);
  return json(serializeEvent(event));
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser(req);
  if (!user || !user.is_active) return error("Authentication required", 401);
  if (user.role !== "ADMIN") return error("Insufficient permissions", 403);

  const id = Number(params.id);
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) return error("Not found", 404);

  const form = await req.formData();
  const update: Record<string, unknown> = {};

  const image = form.get("image");
  if (image instanceof File && image.name && allowedFile(image.name, IMAGE_EXT)) {
    await deleteFile(event.image_url);
    update.image_url = await saveImage(image, "events", [1600, 900]);
  }

  const map: Record<string, string> = {
    title: "title", description: "description", venue: "venue", location: "location",
    ticket_url: "ticket_url", facebook_url: "facebook_url", ra_url: "ra_url",
  };
  for (const [formKey, col] of Object.entries(map)) {
    const v = form.get(formKey);
    if (typeof v === "string") update[col] = v;
  }
  const lineup = form.get("lineup");
  if (typeof lineup === "string") update.lineup = lineup ? JSON.parse(lineup) : [];
  const date = form.get("date");
  if (typeof date === "string" && date) update.date = new Date(date).toISOString();
  const isPublished = form.get("is_published");
  if (typeof isPublished === "string") update.is_published = isPublished.toLowerCase() === "true";
  const isFeatured = form.get("is_featured");
  if (typeof isFeatured === "string") update.is_featured = isFeatured.toLowerCase() === "true";

  const { data: updated } = await supabase.from("events").update(update as TableUpdate<"events">).eq("id", id).select("*").single();
  return json(serializeEvent(updated!));
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser(req);
  if (!user || !user.is_active) return error("Authentication required", 401);
  if (user.role !== "ADMIN") return error("Insufficient permissions", 403);

  const id = Number(params.id);
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) return error("Not found", 404);
  await deleteFile(event.image_url);
  await supabase.from("events").delete().eq("id", id);
  return json({ message: "Deleted" });
}
