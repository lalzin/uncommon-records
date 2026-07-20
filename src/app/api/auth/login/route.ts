import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkPassword, generateToken, json, error } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => ({}));
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");

  if (!email || !password) return error("Email and password required", 400);

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (!user || !(await checkPassword(password, user.password_hash)))
    return error("Invalid credentials", 401);
  if (!user.is_active) return error("Account disabled", 403);

  return json({
    token: await generateToken(user.id, user.role),
    user: serializeUser(user, true),
  });
}
