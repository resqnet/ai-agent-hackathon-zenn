import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run用のスタンドアロンビルド
  output: 'standalone',
  
  // ESLintを本番ビルド時に無効化（デプロイ用）
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript型チェックを本番ビルド時に無効化（デプロイ用）
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // トレイリングスラッシュを追加しない
  trailingSlash: false,
  
  // 画像最適化
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // パフォーマンス最適化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 実験的機能
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // 環境変数の設定
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },
  
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
