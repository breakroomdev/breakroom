/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mirrors APP_URL to the client bundle so workspace links/redirects can be
  // built as absolute subdomain URLs (see src/lib/workspace-url.ts).
  env: {
    NEXT_PUBLIC_APP_URL: process.env.APP_URL,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Trims unused exports from these packages at build time instead of
  // bundling the whole module — smaller client JS, faster cold builds.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
