import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword, generateToken, json, error } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => ({}));
  const token = String(data.token || "").trim();
  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");

  if (!token || !name || !email || !password)
    return error("All fields are required", 400);
  if (password.length < 8)
    return error("Password must be at least 8 characters", 400);

  // Email-specific invite, else generic promo invite.
  let { data: invite } = await supabase
    .from("invite_tokens")
    .select("*")
    .eq("token", token)
    .eq("email", email)
    .maybeSingle();
  if (!invite) {
    const res = await supabase
      .from("invite_tokens")
      .select("*")
      .eq("token", token)
      .is("email", null)
      .eq("invite_type", "promo")
      .maybeSingle();
    invite = res.data;
  }

  const valid = invite && !invite.used && new Date(invite.expires_at) > new Date();
  if (!valid) return error("Invalid or expired invitation link", 400);

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return error("Email already registered", 409);

  const role = invite!.invite_type === "artist" ? "ARTIST" : "USER";
  const { data: user, error: insErr } = await supabase
    .from("users")
    .insert({ name, email, role, password_hash: await hashPassword(password) })
    .select("*")
    .single();
  if (insErr || !user) return error(insErr?.message || "Registration failed", 500);

  await supabase
    .from("invite_tokens")
    .update({ used: true, used_by_email: email })
    .eq("id", invite!.id);

  return json(
    { token: await generateToken(user.id, user.role), user: serializeUser(user, true) },
    201,
  );
}
