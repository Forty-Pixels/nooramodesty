import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
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
