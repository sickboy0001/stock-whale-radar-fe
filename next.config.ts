import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages (Edge Runtime) で動作させるための設定
  serverExternalPackages: ["@libsql/client"],
  // Turbopack 向けの空設定を追加してエラーを回避
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "node:fs": false,
        fs: false,
        "node:path": false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
