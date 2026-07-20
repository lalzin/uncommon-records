import { supabase } from "@/lib/supabase";
import { requireRole, json, error } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";
import type { Role, TableUpdate } from "@/lib/database.types";

export const PUT = requireRole("ADMIN")(async (req, { params }) => {
  const id = Number(params.id);
  const { data: existing } = await supabase.from("users").select("id").eq("id", id).maybeSingle();
  if (!existing) return error("Not found", 404);

  const data = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (["USER", "ARTIST", "ADMIN"].includes(data.role)) update.role = data.role as Role;
  if ("is_active" in data) update.is_active = !!data.is_active;

  const { data: user } = await supabase.from("users").update(update as TableUpdate<"users">).eq("id", id).select("*").single();
  return json(serializeUser(user!, true));
});
