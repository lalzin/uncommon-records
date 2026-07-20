import { supabase } from "@/lib/supabase";
import { requireRole, json } from "@/lib/auth";
import { serializeEvent } from "@/lib/serializers";

// All events incl. unpublished (ADMIN).
export const GET = requireRole("ADMIN")(async () => {
  const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
  return json({ events: (data ?? []).map(serializeEvent) });
});
