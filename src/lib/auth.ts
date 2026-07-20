import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Role, User } from "@prisma/client";
import { prisma } from "./prisma";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-me-in-production",
);
const EXPIRY_DAYS = Number(process.env.JWT_EXPIRY_DAYS || 7);

export interface TokenPayload {
  user_id: number;
  role: Role;
}

export async function generateToken(userId: number, role: Role): Promise<string> {
  return new SignJWT({ user_id: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRY_DAYS}d`)
    .sign(SECRET);
}

export async function decodeToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function checkPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Resolve the authenticated user from the Authorization: Bearer header. */
export async function getCurrentUser(req: NextRequest): Promise<User | null> {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const payload = await decodeToken(header.slice(7));
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.user_id } });
}

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

export const error = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

type Handler = (
  req: NextRequest,
  ctx: { params: Record<string, string>; user: User },
) => Promise<NextResponse> | NextResponse;

/** Wrap a route handler to require an active, authenticated user. */
export function requireAuth(handler: Handler) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    const user = await getCurrentUser(req);
    if (!user || !user.isActive) return error("Authentication required", 401);
    return handler(req, { ...ctx, user });
  };
}

/** Wrap a route handler to require one of the given roles. */
export function requireRole(...roles: Role[]) {
  return (handler: Handler) =>
    async (req: NextRequest, ctx: { params: Record<string, string> }) => {
      const user = await getCurrentUser(req);
      if (!user || !user.isActive) return error("Authentication required", 401);
      if (!roles.includes(user.role)) return error("Insufficient permissions", 403);
      return handler(req, { ...ctx, user });
    };
}
