import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    // Resize through Sanity's CDN (see lib/sanity/imageLoader.ts) so images are
    // served straight from cdn.sanity.io and never hit Netlify's `/_next/image`.
    loader: "custom",
    loaderFile: "./lib/sanity/imageLoader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
    qualities: [75, 90],
  },
  allowedDevOrigins: ['192.168.1.3'],
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
