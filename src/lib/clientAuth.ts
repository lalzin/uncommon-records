"use client";

// Client-side auth/session state — port of static/js/auth.js.
import { getToken, setToken, clearToken } from "./apiClient";

const USER_KEY = "ur_user";

export interface SessionUser {
  id: number;
  name: string;
  email?: string;
  role: "USER" | "ARTIST" | "ADMIN";
  bio?: string | null;
  avatar?: string | null;
  social_links?: Record<string, string>;
}

export const session = {
  set(token: string, user: SessionUser, remember = true) {
    setToken(token, remember);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    clearToken();
    localStorage.removeItem(USER_KEY);
  },
  getUser(): SessionUser | null {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  },
  isLoggedIn() {
    return !!getToken();
  },
  isAdmin() {
    return this.getUser()?.role === "ADMIN";
  },
  isArtist() {
    const role = this.getUser()?.role;
    return role === "ARTIST" || role === "ADMIN";
  },
};

/** Redirect to /login (or /) if the role guard fails. Returns true if allowed. */
export function guard(roles: SessionUser["role"][] = []): boolean {
  if (typeof window === "undefined") return false;
  if (!session.isLoggedIn()) {
    window.location.href = "/login";
    return false;
  }
  if (roles.length && !roles.includes(session.getUser()?.role as SessionUser["role"])) {
    window.location.href = "/";
    return false;
  }
  return true;
}
