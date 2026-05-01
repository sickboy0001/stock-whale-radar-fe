import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages (Edge Runtime) で動作させるための設定
  // 1. yahoo-finance2 をエッジビルドの対象から外す
  serverExternalPackages: ["@libsql/client", "yahoo-finance2"],
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
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        os: false,
        tty: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
