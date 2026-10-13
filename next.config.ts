import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // Photos are resized in the browser (≤ ~400 KB each, max 6 per upload), so this
      // stays under Vercel's 4.5 MB request limit.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
