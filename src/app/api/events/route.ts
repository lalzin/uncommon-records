import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeEvent } from "@/lib/serializers";
import { allowedFile, saveImage, IMAGE_EXT } from "@/lib/storage";

export const dynamic = "force-dynamic";

// GET /api/events — published events, ascending by date.
export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get("limit");
  let q = supabase.from("events").select("*").eq("is_published", true).order("date", { ascending: true });
  if (limit) q = q.limit(Number(limit));
  const { data } = await q;
  return json({ events: (data ?? []).map(serializeEvent) });
}

// POST /api/events — create (ADMIN).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !user.is_active) return error("Authentication required", 401);
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

  const { data: event, error: insErr } = await supabase
    .from("events")
    .insert({
      title: str("title") || "Untitled Event",
      description: str("description"),
      date: new Date(dateStr).toISOString(),
      venue: str("venue"),
      location: str("location"),
      image_url: imageUrl,
      ticket_url: str("ticket_url"),
      facebook_url: str("facebook_url"),
      ra_url: str("ra_url"),
      lineup: lineupRaw ? JSON.parse(lineupRaw) : null,
      is_published: (str("is_published") || "false").toLowerCase() === "true",
      is_featured: (str("is_featured") || "false").toLowerCase() === "true",
    })
    .select("*")
    .single();
  if (insErr || !event) return error(insErr?.message || "Create failed", 500);

  return json(serializeEvent(event), 201);
}
