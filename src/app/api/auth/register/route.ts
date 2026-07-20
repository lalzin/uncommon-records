import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
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
  let invite = await prisma.inviteToken.findFirst({ where: { token, email } });
  if (!invite)
    invite = await prisma.inviteToken.findFirst({
      where: { token, email: null, inviteType: "promo" },
    });

  const valid = invite && !invite.used && invite.expiresAt > new Date();
  if (!valid) return error("Invalid or expired invitation link", 400);

  if (await prisma.user.findUnique({ where: { email } }))
    return error("Email already registered", 409);

  const role = invite!.inviteType === "artist" ? "ARTIST" : "USER";
  const user = await prisma.user.create({
    data: { name, email, role, passwordHash: await hashPassword(password) },
  });
  await prisma.inviteToken.update({
    where: { id: invite!.id },
    data: { used: true, usedByEmail: email },
  });

  return json(
    { token: await generateToken(user.id, user.role), user: serializeUser(user, true) },
    201,
  );
}
