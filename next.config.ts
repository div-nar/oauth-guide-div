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
    return {
      // Agents asking for Markdown on a guide's web address get the Markdown guide.
      beforeFiles: [
        { source: "/guides/:slug", has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }], destination: "/api/guides/:slug/md" },
      ],
      afterFiles: [
        { source: "/guides/:slug.md", destination: "/api/guides/:slug/md" },
        { source: "/guides/:slug.json", destination: "/api/guides/:slug/json" },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
