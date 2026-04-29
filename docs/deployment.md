# Violet 部署文档

## 服务器信息

| 项目 | 值 |
|------|-----|
| 提供商 | 阿里云 ECS |
| 地域 | 华东1（杭州） |
| 公网 IP | 121.43.69.144 |
| 系统 | Ubuntu 24.04 64位 |
| 规格 | 4 vCPU / 8 GiB / 40 GiB ESSD |
| SSH | `ssh root@121.43.69.144` |
| 安全组 | sg-bp17bw7623shtw5l49sr |

## 服务器目录结构

```
/home/violet/
├── server/                  # 后端（NestJS）
│   ├── dist/                # 编译产物
│   │   └── src/main.js      # 入口文件
│   ├── prisma/              # Prisma schema + migrations
│   ├── node_modules/        # 生产依赖
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── .env                 # 生产环境变量（敏感，不上传到 git）
└── client/
    └── dist/                # 前端构建产物
        ├── index.html
        ├── assets/
        └── favicon.svg
```

## 已安装服务

| 服务 | 版本 | 用途 |
|------|------|------|
| Node.js | 22.x | 运行时 |
| pnpm | 10.x | 包管理 |
| pm2 | 6.x | 进程守护 |
| PostgreSQL | 16 | 数据库 |
| Redis | 7 | 缓存 |
| Nginx | 1.24 | 反向代理 |

## 生产环境变量

`/home/violet/server/.env`：

```env
DATABASE_URL="postgresql://violet:<密码>@localhost:5432/violet?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=<随机生成的密钥>
CORS_ORIGIN=http://121.43.69.144
PORT=3000

# SMTP（尚未启用，暂时占位）
SMTP_HOST=smtp.nju.edu.cn
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=placeholder@smail.nju.edu.cn
SMTP_PASS=placeholder
```

> 修改 `.env` 后需执行 `pm2 restart violet-api` 生效。

## Nginx 配置

文件：`/etc/nginx/sites-available/violet`（已链接到 `sites-enabled/`）

```nginx
server {
    listen 80;
    server_name 121.43.69.144;

    root /home/violet/client/dist;
    index index.html;

    # SPA 路由 — 所有非文件请求返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket (Socket.io)
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

修改 Nginx 配置后：

```bash
nginx -t && systemctl reload nginx
```

## 日常更新流程

### 前后端都有改动

```bash
# 1. 本地构建
cd /path/to/Violet

# 构建后端
cd server && pnpm build && cd ..

# 构建前端
cd client && pnpm build && cd ..

# 2. 打包上传
# 后端
tar czf /tmp/violet-server.tar.gz -C server dist prisma package.json pnpm-lock.yaml
scp /tmp/violet-server.tar.gz root@121.43.69.144:/home/violet/server/

# 前端
tar czf /tmp/violet-client.tar.gz -C client dist
scp /tmp/violet-client.tar.gz root@121.43.69.144:/home/violet/client/

# 3. SSH 到服务器执行更新
ssh root@121.43.69.144

# 解压后端
cd /home/violet/server
tar xzf violet-server.tar.gz && rm violet-server.tar.gz

# 安装依赖（如果 package.json 有变化）
pnpm install --prod

# 生成 Prisma Client（如果 schema 有变化）
node node_modules/.pnpm/prisma@*/node_modules/prisma/build/index.js generate

# 应用数据库迁移（如果 prisma/migrations 有新增）
node node_modules/.pnpm/prisma@*/node_modules/prisma/build/index.js migrate deploy

# 重启后端
pm2 restart violet-api

# 解压前端
cd /home/violet/client
tar xzf violet-client.tar.gz && rm violet-client.tar.gz

# 前端是静态文件，无需重启，刷新浏览器即可

# 4. 清理本地临时文件
rm /tmp/violet-server.tar.gz /tmp/violet-client.tar.gz
```

### 仅后端更新

```bash
cd /path/to/Violet/server && pnpm build
tar czf /tmp/violet-server.tar.gz -C server dist prisma package.json pnpm-lock.yaml
scp /tmp/violet-server.tar.gz root@121.43.69.144:/home/violet/server/

ssh root@121.43.69.144
cd /home/violet/server && tar xzf violet-server.tar.gz && rm violet-server.tar.gz
pnpm install --prod        # 按需
node node_modules/.pnpm/prisma@*/node_modules/prisma/build/index.js generate    # 按需
node node_modules/.pnpm/prisma@*/node_modules/prisma/build/index.js migrate deploy    # 按需
pm2 restart violet-api
```

### 仅前端更新

```bash
cd /path/to/Violet/client && pnpm build
tar czf /tmp/violet-client.tar.gz -C client dist
scp /tmp/violet-client.tar.gz root@121.43.69.144:/home/violet/client/

ssh root@121.43.69.144
cd /home/violet/client && tar xzf violet-client.tar.gz && rm violet-client.tar.gz
```

前端无需重启任何服务，浏览器刷新即可。

### 仅数据库迁移

```bash
ssh root@121.43.69.144
cd /home/violet/server
node node_modules/.pnpm/prisma@*/node_modules/prisma/build/index.js migrate deploy
```

## 常用运维命令

```bash
# 查看后端状态
pm2 status

# 查看后端日志（实时）
pm2 logs violet-api

# 查看最近 50 行日志
pm2 logs violet-api --lines 50 --nostream

# 重启后端
pm2 restart violet-api

# 停止后端
pm2 stop violet-api

# 重启 Nginx
systemctl reload nginx

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log

# 测试数据库连接
psql -U violet -d violet -h localhost -c "SELECT 1"

# 测试 Redis
redis-cli ping

# 查看磁盘使用
df -h

# 查看 pm2 开机自启状态
systemctl status pm2-root
```

## 架构图

```
          用户浏览器
              │
              ▼
  ┌───────────────────────┐
  │     Nginx (80)        │
  │                       │
  │  /           → 静态   │──→ /home/violet/client/dist/
  │  /api/*     → 代理   │──→ localhost:3000
  │  /socket.io → WS代理 │──→ localhost:3000
  └───────────────────────┘
              │
              ▼
  ┌───────────────────────┐
  │  NestJS (3000)        │
  │  pm2 守护: violet-api │
  │  API + Socket.io      │
  └──────┬───────┬────────┘
         │       │
         ▼       ▼
  ┌──────────┐ ┌───────┐
  │PostgreSQL│ │ Redis │
  │  (5432)  │ │(6379) │
  └──────────┘ └───────┘
```

## 注意事项

- **磁盘空间**：40G ESSD 为系统盘，随实例释放而丢失，重要数据注意备份
- **HTTPS**：当前为 HTTP 明文传输，绑定域名后需配置 SSL 证书
- **密码安全**：定期更换 SSH 密码和 JWT_SECRET
- **日志清理**：pm2 日志会持续增长，定期清理 `~/.pm2/logs/`
- **数据库备份**：`pg_dump -U violet violet > backup.sql`
