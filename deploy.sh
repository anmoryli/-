#!/bin/bash
# ============================================
# 孕期宝 · 一键部署脚本
# ============================================
set -e

echo "🤰 孕期宝 一键部署"
echo "=========================================="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 未安装 Docker，请先安装: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker compose version &> /dev/null 2>&1; then
    echo "❌ 未安装 Docker Compose V2，请升级 Docker"
    exit 1
fi

echo "✅ Docker 环境检查通过"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  未找到 .env 文件"
    echo "   正在从 .env.example 复制..."
    cp .env.example .env
    echo ""
    echo "📝 请编辑 .env 文件，填写真实配置后重新运行此脚本"
    echo "   vim .env"
    echo ""
    exit 1
fi

echo "✅ .env 配置文件已就绪"
echo ""

# 构建并启动
echo "🔨 开始构建镜像（首次约需 5-10 分钟）..."
echo ""

docker compose build --parallel

echo ""
echo "🚀 启动所有服务..."
echo ""

docker compose up -d

echo ""
echo "=========================================="
echo "✅ 部署完成！"
echo ""
echo "📡 服务地址："
echo "   前端:     http://localhost:${FRONTEND_PORT:-3000}"
echo "   后端 API: http://localhost:${BACKEND_PORT:-9677}"
echo "   管理后台: http://localhost:${ADMIN_PORT:-5000}"
echo "   统一入口: http://localhost:${NGINX_PORT:-80}"
echo ""
echo "📋 常用命令："
echo "   查看日志:   docker compose logs -f"
echo "   查看状态:   docker compose ps"
echo "   停止服务:   docker compose down"
echo "   重启服务:   docker compose restart"
echo "   重新构建:   docker compose up -d --build"
echo "=========================================="
