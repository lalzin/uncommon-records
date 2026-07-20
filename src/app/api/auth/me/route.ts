import { supabase } from "@/lib/supabase";
import { requireAuth, json } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";
import type { TableUpdate } from "@/lib/database.types";

export const GET = requireAuth(async (_req, { user }) =>
  json(serializeUser(user, true)),
);

export const PUT = requireAuth(async (req, { user }) => {
  const data = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = {};
  if (typeof data.name === "string") update.name = data.name.trim();
  if ("bio" in data) update.bio = data.bio;
  if ("social_links" in data) update.social_links = data.social_links || {};

  const { data: updated } = await supabase
    .from("users")
    .update(update as TableUpdate<"users">)
    .eq("id", user.id)
    .select("*")
    .single();
  return json(serializeUser(updated ?? user, true));
});
