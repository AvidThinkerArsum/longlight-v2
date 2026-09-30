import type { NextConfig } from "next";

// Static export. BASE_PATH lets the same build live under a sub-path (e.g. GitHub
// Pages at /longlight); locally it stays at the root.
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.BASE_PATH || undefined,
  images: { unoptimized: true },
  turbopack: { root: process.cwd() },
};

export default nextConfig;
