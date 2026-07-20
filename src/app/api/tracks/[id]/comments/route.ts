import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, json, error } from "@/lib/auth";
import { serializeComment } from "@/lib/serializers";

const commentInclude = { user: true, _count: { select: { replies: true } } } as const;

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const trackId = Number(params.id);
  const comments = await prisma.comment.findMany({
    where: { trackId, parentId: null },
    include: commentInclude,
    orderBy: { createdAt: "desc" },
  });
  return json(comments.map(serializeComment));
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser(req);
  if (!user || !user.isActive) return error("Authentication required", 401);

  const trackId = Number(params.id);
  const data = await req.json().catch(() => ({}));
  const content = String(data.content || "").trim();
  if (!content) return error("Content required", 400);

  const comment = await prisma.comment.create({
    data: {
      content,
      userId: user.id,
      trackId,
      parentId: data.parent_id ?? null,
    },
    include: commentInclude,
  });
  return json(serializeComment(comment), 201);
}
