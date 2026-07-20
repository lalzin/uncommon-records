import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, error } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const token = (sp.get("token") || "").trim();
  const emailRaw = sp.get("email");
  const email = emailRaw ? emailRaw.trim().toLowerCase() : null;

  if (!token) return json({ valid: false, error: "Missing token" }, 400);

  const invite = email
    ? await prisma.inviteToken.findFirst({ where: { token, email } })
    : await prisma.inviteToken.findFirst({ where: { token } });

  const valid = invite && !invite.used && invite.expiresAt > new Date();
  if (!valid)
    return json({ valid: false, error: "Invalid or expired invitation link" }, 400);

  if (invite!.inviteType === "promo_download")
    return json(
      { valid: false, error: "This link is for promo download, not registration" },
      400,
    );

  if (email && (await prisma.user.findUnique({ where: { email } })))
    return json({ valid: false, error: "Email already registered" }, 409);

  return json({
    valid: true,
    email,
    invite_type: invite!.inviteType,
    expires_at: invite!.expiresAt.toISOString(),
  });
}
