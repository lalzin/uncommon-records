import { requireRole, json, error } from "@/lib/auth";
import { presignUpload, allowedFile, AUDIO_EXT, type Category } from "@/lib/storage";

// Returns a presigned PUT URL so the browser uploads big audio straight to the
// bucket, then sends back `key` with POST /api/tracks (field `audio_key`).
export const POST = requireRole("ADMIN", "ARTIST")(async (req) => {
  const data = await req.json().catch(() => ({}));
  const filename = String(data.filename || "");
  const contentType = String(data.content_type || "application/octet-stream");
  const category = (data.category || "audio") as Category;

  if (category === "audio" && !allowedFile(filename, AUDIO_EXT))
    return error("Invalid audio file type", 400);

  const { uploadUrl, key } = await presignUpload(category, filename, contentType);
  return json({ upload_url: uploadUrl, key });
});
