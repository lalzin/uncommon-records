import { prisma } from "@/lib/prisma";
import { requireRole, json } from "@/lib/auth";
import { serializeInvite } from "@/lib/serializers";

const FRONTEND = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

export const GET = requireRole("ADMIN")(async (req) => {
  let inviteType = req.nextUrl.searchParams.get("type");
  if (inviteType === "promo") inviteType = "promo_download"; // back-compat

  const invites = await prisma.inviteToken.findMany({
    where: inviteType ? { inviteType } : {},
    orderBy: { createdAt: "desc" },
    include: { track: { include: { artist: true } } },
  });

  const result = invites.map((invite) => {
    const payload = serializeInvite(invite) as Record<string, unknown>;
    payload.link =
      invite.inviteType === "promo_download"
        ? `${FRONTEND}/promo/${invite.token}`
        : `${FRONTEND}/register?token=${invite.token}` +
          (invite.email ? `&email=${invite.email}` : "");
    payload.track = invite.track
      ? {
          id: invite.track.id,
          title: invite.track.title,
          artist_name: invite.track.artist?.name ?? null,
        }
      : null;
    return payload;
  });
  return json(result);
});
