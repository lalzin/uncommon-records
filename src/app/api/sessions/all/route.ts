import { supabase } from "@/lib/supabase";
import { requireRole, json } from "@/lib/auth";
import { serializeSession } from "@/lib/serializers";

export const GET = requireRole("ADMIN")(async () => {
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  return json({ sessions: (data ?? []).map(serializeSession) });
});
