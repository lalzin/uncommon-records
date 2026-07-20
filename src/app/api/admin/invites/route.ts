import { supabase } from "@/lib/supabase";
import { requireRole, json } from "@/lib/auth";
import { serializeInvite } from "@/lib/serializers";
import type { InviteTokenRow } from "@/lib/database.types";

const FRONTEND = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

type InviteWithTrack = InviteTokenRow & {
  track: { id: number; title: string; artist: { name: string } | null } | null;
};

export const GET = requireRole("ADMIN")(async (req) => {
  let inviteType = req.nextUrl.searchParams.get("type");
  if (inviteType === "promo") inviteType = "promo_download"; // back-compat

  let q = supabase
    .from("invite_tokens")
    .select("*, track:tracks!invite_tokens_track_id_fkey(id, title, artist:users!tracks_artist_id_fkey(name))")
    .order("created_at", { ascending: false });
  if (inviteType) q = q.eq("invite_type", inviteType);
  const { data } = await q;
  const invites = (data ?? []) as unknown as InviteWithTrack[];

  const result = invites.map((invite) => {
    const payload = serializeInvite(invite) as Record<string, unknown>;
    payload.link =
      invite.invite_type === "promo_download"
        ? `${FRONTEND}/promo/${invite.token}`
        : `${FRONTEND}/register?token=${invite.token}` + (invite.email ? `&email=${invite.email}` : "");
    payload.track = invite.track
      ? { id: invite.track.id, title: invite.track.title, artist_name: invite.track.artist?.name ?? null }
      : null;
    return payload;
  });
  return json(result);
});
