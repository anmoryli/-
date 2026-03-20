/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Next.js 16 默认 Turbopack，无自定义 webpack 时显式声明避免告警
  turbopack: {},
  // 大文件上传经代理时需提高 body 限制（如 20MB+ 视频）
  experimental: {
    proxyClientMaxBodySize: "500mb",
    serverActions: { bodySizeLimit: "50mb" },
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ]
  },
  // 代理到后端，避免浏览器直连 9677 时的 CORS
  async rewrites() {
    return [
      {
        source: "/api-backend/:path*",
        destination: "http://localhost:9677/:path*",
      },
    ]
  },
}

export default nextConfig
