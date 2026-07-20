import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Server-side Supabase client using the SERVICE ROLE / SECRET API key.
// This key bypasses Row Level Security and must NEVER be exposed to the browser.
// (All our data access happens in API route handlers, i.e. server-side only.)

const url = process.env.SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  // Thrown lazily at first import in a request; surfaces a clear message in logs.
  console.warn(
    "[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants — configure les variables d'environnement.",
  );
}

const globalForSupabase = globalThis as unknown as {
  supabase?: ReturnType<typeof createClient<Database>>;
};

export const supabase =
  globalForSupabase.supabase ??
  createClient<Database>(url ?? "", serviceKey ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });

if (process.env.NODE_ENV !== "production") globalForSupabase.supabase = supabase;
