import { supabase } from "@/lib/supabase";
import { requireAuth, json, error } from "@/lib/auth";

export const DELETE = requireAuth(async (_req, { params, user }) => {
  const id = Number(params.id);
  const { data: comment } = await supabase
    .from("comments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!comment) return error("Not found", 404);
  if (comment.user_id !== user.id && user.role !== "ADMIN") return error("Forbidden", 403);
  await supabase.from("comments").delete().eq("id", id);
  return json({ message: "Deleted" });
});
