/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Audio/cover/event images are served from the object store (S3/R2/Vercel Blob).
  // Add your bucket/CDN hostname here so <Image> and direct links are allowed.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  // Large audio uploads go straight to the bucket via presigned URLs,
  // so we do NOT need to raise the serverless body size limit here.
};

export default nextConfig;
