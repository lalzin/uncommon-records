import { supabase } from "@/lib/supabase";
import { requireRole, json, error } from "@/lib/auth";

export const DELETE = requireRole("ADMIN")(async (_req, { params }) => {
  const id = Number(params.id);
  const { data: invite } = await supabase.from("invite_tokens").select("id").eq("id", id).maybeSingle();
  if (!invite) return error("Not found", 404);
  await supabase.from("invite_tokens").delete().eq("id", id);
  return json({ ok: true });
});
