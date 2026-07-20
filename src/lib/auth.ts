import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase";
import type { Role, UserRow } from "./database.types";

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
export async function getCurrentUser(req: NextRequest): Promise<UserRow | null> {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const payload = await decodeToken(header.slice(7));
  if (!payload) return null;
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", payload.user_id)
    .maybeSingle();
  return data;
}

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

export const error = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

type Handler = (
  req: NextRequest,
  ctx: { params: Record<string, string>; user: UserRow },
) => Promise<NextResponse> | NextResponse;

/** Wrap a route handler to require an active, authenticated user. */
export function requireAuth(handler: Handler) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    const user = await getCurrentUser(req);
    if (!user || !user.is_active) return error("Authentication required", 401);
    return handler(req, { ...ctx, user });
  };
}

/** Wrap a route handler to require one of the given roles. */
export function requireRole(...roles: Role[]) {
  return (handler: Handler) =>
    async (req: NextRequest, ctx: { params: Record<string, string> }) => {
      const user = await getCurrentUser(req);
      if (!user || !user.is_active) return error("Authentication required", 401);
      if (!roles.includes(user.role)) return error("Insufficient permissions", 403);
      return handler(req, { ...ctx, user });
    };
}
