/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // These packages are only used by server code (API routes and the worker).
  // Keeping them external avoids bundling them into the Next.js server build.
  serverExternalPackages: ['@upstash/redis', 'cheerio', 'axios'],
};

export default nextConfig;
