import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole, json, error } from "@/lib/auth";
import { serializeInvite, serializeTrack } from "@/lib/serializers";
import { trackInclude } from "@/lib/trackInclude";
import { sendInviteEmail } from "@/lib/mail";

const FRONTEND = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
const TTL_HOURS = Number(process.env.INVITE_TOKEN_TTL || 48);

export const POST = requireRole("ADMIN")(async (req, { user }) => {
  const data = await req.json().catch(() => ({}));
  let email: string | null = data.email ? String(data.email).trim().toLowerCase() : null;
  let inviteType: string = data.type || "artist";
  let trackIdRaw = data.track_id;

  if (inviteType === "promo") inviteType = "promo_download"; // back-compat
  if (inviteType === "artist" && !email)
    return error("Email required for artist invite", 400);
  if (!["artist", "promo_download"].includes(inviteType))
    return error("Invalid invite type", 400);

  let track = null;
  if (inviteType === "promo_download") {
    email = `promo-download-${randomBytes(8).toString("hex")}@uncommon.local`;
    if (!trackIdRaw) return error("track_id is required for promo download link", 400);
    const trackId = Number(trackIdRaw);
    if (!Number.isInteger(trackId)) return error("track_id must be an integer", 400);
    track = await prisma.track.findUnique({ where: { id: trackId }, include: trackInclude });
    if (!track) return error("Track not found", 404);
    if (!track.downloadable) return error("Track is not downloadable", 400);
  }

  // Revoke any existing unused invite for this email.
  if (email) await prisma.inviteToken.deleteMany({ where: { email, used: false } });

  const token = randomBytes(32).toString("hex");
  const invite = await prisma.inviteToken.create({
    data: {
      token,
      email,
      inviteType,
      trackId: track?.id ?? null,
      createdBy: user.id,
      expiresAt: new Date(Date.now() + TTL_HOURS * 3600 * 1000),
    },
  });

  const link =
    inviteType === "promo_download"
      ? `${FRONTEND}/promo/${token}`
      : `${FRONTEND}/register?token=${token}` + (email ? `&email=${email}` : "");

  let emailSent = false;
  if (inviteType === "artist" && email) emailSent = await sendInviteEmail(email, link);

  return json(
    {
      invite: serializeInvite(invite),
      link,
      track: track ? serializeTrack(track) : null,
      email_sent: emailSent,
    },
    201,
  );
});
