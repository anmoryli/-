# ============================================
# 孕期宝 · 前端 Dockerfile (多阶段构建)
# ============================================

# ---------- 阶段1: 安装依赖 + 构建 ----------
FROM node:22-alpine AS builder
WORKDIR /build

# 安装依赖（利用缓存）
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# 复制源码并构建
COPY . .

# 构建时注入 standalone 输出模式（不修改原始 next.config.mjs）
ENV NEXT_PRIVATE_STANDALONE=true

# 构建时后端地址：浏览器端走 Nginx 反代，服务端渲染走内网
ARG NEXT_PUBLIC_API_BASE_URL=""
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

RUN pnpm build

# ---------- 阶段2: 运行时 ----------
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

# 拷贝 standalone 产物
COPY --from=builder /build/.next/standalone ./
COPY --from=builder /build/.next/static ./.next/static
COPY --from=builder /build/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
