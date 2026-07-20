"use client";

// Browser-side API client — mirrors the original static/js/api.js.
// Attaches the JWT from storage and centralises error handling.

const BASE_URL = "/api";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ur_token") || sessionStorage.getItem("ur_token");
}

export function setToken(token: string, remember = true) {
  (remember ? localStorage : sessionStorage).setItem("ur_token", token);
}

export function clearToken() {
  localStorage.removeItem("ur_token");
  sessionStorage.removeItem("ur_token");
}

async function request<T = unknown>(
  method: string,
  endpoint: string,
  body: unknown = null,
  isFormData = false,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData && body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? (isFormData ? (body as BodyInit) : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data as { error?: string }).error || "Request failed");
    Object.assign(err, { status: res.status, data });
    throw err;
  }
  return data as T;
}

export const api = {
  get: <T = unknown>(e: string) => request<T>("GET", e),
  post: <T = unknown>(e: string, b?: unknown) => request<T>("POST", e, b),
  put: <T = unknown>(e: string, b?: unknown) => request<T>("PUT", e, b),
  delete: <T = unknown>(e: string) => request<T>("DELETE", e),
  upload: <T = unknown>(e: string, fd: FormData) => request<T>("POST", e, fd, true),
  uploadPut: <T = unknown>(e: string, fd: FormData) => request<T>("PUT", e, fd, true),
};

/**
 * Upload an audio file directly to the bucket via a presigned URL, then return
 * the storage key to attach to a track (field `audio_key`).
 * Falls back transparently to nothing if the file is missing.
 */
export async function uploadAudioDirect(file: File): Promise<string> {
  const { upload_url, key } = await api.post<{ upload_url: string; key: string }>(
    "/uploads/presign",
    { filename: file.name, content_type: file.type || "application/octet-stream", category: "audio" },
  );
  const put = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error("Échec de l'upload audio vers le bucket");
  return key;
}
