import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { randomBytes } from "crypto";

const BUCKET = process.env.S3_BUCKET || "uncommon-uploads";
const PUBLIC_BASE = (process.env.S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");

export const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  // R2 / custom S3-compatible endpoint. Empty => real AWS S3.
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: !!process.env.S3_ENDPOINT, // path-style for R2/minio
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
});

export type Category = "covers" | "events" | "avatars" | "audio";
export const AUDIO_EXT = new Set(["mp3", "wav", "flac", "aiff", "m4a"]);
export const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

const uid = () => randomBytes(16).toString("hex");

export function extOf(filename: string): string {
  return filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
}

export function allowedFile(filename: string, allowed: Set<string>): boolean {
  return filename.includes(".") && allowed.has(extOf(filename));
}

/** Build the public URL for a stored object key (e.g. "covers/abc.webp"). */
export function publicUrl(key: string | null): string | null {
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `${PUBLIC_BASE}/${key}`;
}

/** Upload raw bytes and return the storage key (category/uuid.ext). */
export async function putObject(
  body: Buffer,
  category: Category,
  ext: string,
  contentType: string,
): Promise<string> {
  const key = `${category}/${uid()}.${ext}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return key;
}

/** Resize an uploaded image to webp and store it. Returns the storage key. */
export async function saveImage(
  file: File,
  category: Category,
  maxSize: [number, number] = [1200, 1200],
): Promise<string> {
  const ext = extOf(file.name);
  if (!IMAGE_EXT.has(ext)) throw new Error("File type not allowed");
  const input = Buffer.from(await file.arrayBuffer());
  const webp = await sharp(input)
    .resize(maxSize[0], maxSize[1], { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  return putObject(webp, category, "webp", "image/webp");
}

/** Store an arbitrary uploaded file (audio) as-is. Returns the storage key. */
export async function saveFile(file: File, category: Category): Promise<string> {
  const ext = extOf(file.name);
  const buf = Buffer.from(await file.arrayBuffer());
  return putObject(buf, category, ext, file.type || "application/octet-stream");
}

export async function deleteFile(key: string | null): Promise<void> {
  if (!key || key.startsWith("http")) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
    /* ignore missing objects */
  }
}

/**
 * Presigned PUT URL so the browser can upload large audio files directly to
 * the bucket (bypassing the 4.5 MB serverless body limit). Returns the URL to
 * PUT to and the final storage key to persist on the track.
 */
export async function presignUpload(
  category: Category,
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; key: string }> {
  const ext = extOf(filename) || "bin";
  const key = `${category}/${uid()}.${ext}`;
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 600 },
  );
  return { uploadUrl, key };
}

/** Presigned GET URL for forced download of a private object. */
export async function presignDownload(key: string, downloadName: string): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${downloadName}"`,
    }),
    { expiresIn: 300 },
  );
}
