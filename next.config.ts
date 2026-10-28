import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      { source: "/guides/:slug.md", destination: "/api/guides/:slug/md" },
      { source: "/guides/:slug.json", destination: "/api/guides/:slug/json" },
    ];
  },
};

export default nextConfig;
