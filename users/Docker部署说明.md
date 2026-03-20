# 孕期宝 · Docker 一键部署说明

## 前置要求

- Docker 24+ 且包含 Docker Compose V2
- 确保 MySQL 和 Redis 服务可从部署机器访问

## 文件清单

```
yunqibao/
├── docker-compose.yml       # 编排文件（4 个服务）
├── .env.example             # 环境变量模板
├── deploy.sh                # 一键部署脚本
├── nginx/
│   └── default.conf         # Nginx 反向代理配置
├── backend/
│   ├── Dockerfile           # 后端多阶段构建
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile           # 前端多阶段构建
│   └── .dockerignore
└── admin-app/
    ├── Dockerfile           # 管理后台
    └── .dockerignore
```

## 一键部署

```bash
# 1. 复制环境变量文件并填写真实配置
cp .env.example .env
vim .env

# 2. 一键部署
bash deploy.sh
```

## 手动部署

```bash
# 构建
docker compose build --parallel

# 启动
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f
docker compose logs -f backend    # 仅看后端
docker compose logs -f frontend   # 仅看前端
```

## 服务架构

```
                    ┌──────────┐
  用户 ──80端口──▶  │  Nginx   │
                    └──────────┘
                    /     |      \
                   /      |       \
            ┌─────┐  ┌───────┐  ┌──────┐
            │前端 │  │后端API│  │管理台│
            │:3000│  │:9677  │  │:5000 │
            └─────┘  └───────┘  └──────┘
                         |
                    ┌────┴────┐
                    │ MySQL   │  (远程)
                    │ Redis   │  (远程)
                    │ Milvus  │  (远程)
                    └─────────┘
```

## 路由规则

| 路径 | 转发目标 | 说明 |
|------|----------|------|
| `/` | frontend:3000 | 前端页面 |
| `/api/*` | backend:9677 | 后端 REST API + SSE 流式 |
| `/api-backend/*` | backend:9677 | 前端 rewrite 代理路径 |
| `/admin/*` | admin:5000 | Flask 管理后台 |

## 常用运维命令

```bash
# 停止所有服务
docker compose down

# 重启某个服务
docker compose restart backend

# 重新构建并启动（代码更新后）
docker compose up -d --build

# 只重建后端
docker compose up -d --build backend

# 清理旧镜像
docker image prune -f

# 进入容器排查
docker exec -it yunqibao-backend sh
docker exec -it yunqibao-frontend sh
```

## 注意事项

1. **MySQL/Redis 未容器化**：使用的是远程服务器实例，无需在 Docker 中启动
2. **首次构建耗时**：Maven 下载依赖 + npm install 约 5-10 分钟，后续构建利用缓存会快很多
3. **SSE 流式**：Nginx 已配置 `proxy_buffering off`，确保 AI 对话流式输出正常
4. **文件上传**：Nginx `client_max_body_size` 已设为 500MB，与后端一致
5. **环境变量优先**：Docker 启动时的环境变量会覆盖 application.yml 中的配置
