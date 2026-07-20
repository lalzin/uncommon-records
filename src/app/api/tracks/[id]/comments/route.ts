import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeComment, type CommentWithRel } from "@/lib/serializers";

const COMMENT_SELECT =
  "*, user:users!comments_user_id_fkey(*), replies:comments!comments_parent_id_fkey(count)";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const trackId = Number(params.id);
  const { data } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("track_id", trackId)
    .is("parent_id", null)
    .order("created_at", { ascending: false });
  const comments = (data ?? []) as unknown as CommentWithRel[];
  return json(comments.map(serializeComment));
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser(req);
  if (!user || !user.is_active) return error("Authentication required", 401);

  const trackId = Number(params.id);
  const data = await req.json().catch(() => ({}));
  const content = String(data.content || "").trim();
  if (!content) return error("Content required", 400);

  const { data: comment, error: insErr } = await supabase
    .from("comments")
    .insert({
      content,
      user_id: user.id,
      track_id: trackId,
      parent_id: data.parent_id ?? null,
    })
    .select(COMMENT_SELECT)
    .single();
  if (insErr || !comment) return error(insErr?.message || "Create failed", 500);

  return json(serializeComment(comment as unknown as CommentWithRel), 201);
}
