import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages (Edge Runtime) で動作させるための設定
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
