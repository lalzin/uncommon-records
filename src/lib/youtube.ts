// Port of app/models/session.py YouTube helpers.

export function extractYoutubeId(value?: string | null): string | null {
  if (!value) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.replace(/^\/+|\/+$/g, "");

  if (host === "youtu.be" || host === "www.youtu.be") {
    return path ? path.split("/")[0] : null;
  }
  if (host.includes("youtube.com")) {
    if (path === "watch") return parsed.searchParams.get("v");
    const parts = path.split("/");
    if (parts.length >= 2 && ["embed", "shorts", "live"].includes(parts[0])) {
      return parts[1];
    }
  }
  return null;
}

export function buildYoutubeEmbedUrl(value?: string | null): string | null {
  const id = extractYoutubeId(value);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function buildYoutubeThumbnailUrl(value?: string | null): string | null {
  const id = extractYoutubeId(value);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
