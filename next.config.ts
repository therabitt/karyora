import type { NextConfig } from "next";

function getArtworkStorageRemotePattern() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      return {
        protocol: url.protocol.slice(0, -1) as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/public/artworks-public/**",
      };
    } catch {
      // Fall back to the standard Supabase hostname pattern.
    }
  }
  return {
    protocol: "https" as const,
    hostname: "**.supabase.co",
    pathname: "/storage/v1/object/public/artworks-public/**",
  };
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [getArtworkStorageRemotePattern()],
    qualities: [75, 85],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
