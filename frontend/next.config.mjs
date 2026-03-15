/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 大文件上传经代理时需提高 body 限制（如 20MB+ 视频）
  experimental: {
    proxyClientMaxBodySize: "500mb",
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
