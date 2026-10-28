import type { NextConfig } from "next";

function getSupabaseImageRemotePattern() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      return {
        protocol: url.protocol.slice(0, -1) as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/public/**",
      };
    } catch {
      // Fall back to the standard Supabase hostname pattern if the environment
      // value is missing or malformed. The application still validates its URL
      // configuration where it creates public storage URLs.
    }
  }

  return {
    protocol: "https" as const,
    hostname: "**.supabase.co",
    pathname: "/storage/v1/object/public/**",
  };
}

const nextConfig: NextConfig = {
  images: {
    // Allow optimization only for public Supabase Storage objects.
    remotePatterns: [getSupabaseImageRemotePattern()],
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
