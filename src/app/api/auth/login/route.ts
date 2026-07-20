import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPassword, generateToken, json, error } from "@/lib/auth";
import { serializeUser } from "@/lib/serializers";

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => ({}));
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");

  if (!email || !password) return error("Email and password required", 400);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await checkPassword(password, user.passwordHash)))
    return error("Invalid credentials", 401);
  if (!user.isActive) return error("Account disabled", 403);

  return json({
    token: await generateToken(user.id, user.role),
    user: serializeUser(user, true),
  });
}
