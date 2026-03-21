# Redis 安装与 Spring 配置

## Ubuntu 安装 Redis

```bash
sudo apt update && sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
redis-cli ping   # 应返回 PONG
```

可选配置（`/etc/redis/redis.conf`）：

- `bind 127.0.0.1`：仅本机访问
- `requirepass 你的密码`：设置密码后，在应用里配置 `REDIS_PASSWORD`

## Spring 配置说明

- **依赖**：`backend/pom.xml` 已加入 `spring-boot-starter-data-redis`。
- **配置**：`application.yml` 中已增加：

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      timeout: 3000ms
```

- **环境变量**（可选）：部署时设置 `REDIS_HOST`、`REDIS_PORT`、`REDIS_PASSWORD`。
- **缓存**：`RedisCacheConfig` 启用 `@Cacheable`，当前对「用户信息」使用 `user` 缓存，TTL 10 分钟；写操作通过 `@CacheEvict` 失效对应用户缓存。

未安装 Redis 时，需排除 Redis 自动配置或先安装 Redis，否则应用启动会报连接失败。
