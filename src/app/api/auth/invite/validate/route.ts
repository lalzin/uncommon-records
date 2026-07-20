import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { json } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const token = (sp.get("token") || "").trim();
  const emailRaw = sp.get("email");
  const email = emailRaw ? emailRaw.trim().toLowerCase() : null;

  if (!token) return json({ valid: false, error: "Missing token" }, 400);

  const query = supabase.from("invite_tokens").select("*").eq("token", token);
  const { data: invite } = email
    ? await query.eq("email", email).maybeSingle()
    : await query.maybeSingle();

  const valid = invite && !invite.used && new Date(invite.expires_at) > new Date();
  if (!valid)
    return json({ valid: false, error: "Invalid or expired invitation link" }, 400);

  if (invite!.invite_type === "promo_download")
    return json(
      { valid: false, error: "This link is for promo download, not registration" },
      400,
    );

  if (email) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing) return json({ valid: false, error: "Email already registered" }, 409);
  }

  return json({
    valid: true,
    email,
    invite_type: invite!.invite_type,
    expires_at: invite!.expires_at,
  });
}
