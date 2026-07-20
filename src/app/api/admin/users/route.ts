import { supabase } from "@/lib/supabase";
import { requireRole, json } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

export const GET = requireRole("ADMIN")(async () => {
  const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  return json((data ?? []).map((u) => serializeUser(u, true)));
});
