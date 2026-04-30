---
name: violet-deploy
description: Deploy or update Violet on the Alibaba Cloud ECS server. Supports full deploy, backend-only, frontend-only, and database-migration modes. Also provides status checks, log viewing, and CI/CD information.
---

Deploy and update Violet on the production server.

**Input**: Optionally specify a mode. If omitted, auto-detect based on what changed (compare git diff against the deployed state), or ask the user.

## Server Context

| Item | Value |
|------|-------|
| Host | `121.43.69.144` |
| User | `root` |
| SSH (key) | `ssh -i ~/.ssh/violet-deploy root@121.43.69.144` |
| SSH (password) | `ssh root@121.43.69.144` (password auth, fallback) |
| OS | Ubuntu 24.04 |
| Backend dir | `/home/violet/server/` |
| Frontend dir | `/home/violet/client/dist/` |
| Nginx config | `/etc/nginx/sites-available/violet` |
| pm2 process | `violet-api` |
| Entry point | `dist/src/main.js` (NOT `dist/main.js`) |

## CI/CD

Violet 使用 GitHub Actions 自动部署。每次 push 到 `main` 分支：

```
push main → CI (lint + build + test) → CI 通过 → Deploy 自动触发
```

- **CI workflow**: `.github/workflows/ci.yml` — 前端构建 + 后端构建 + 后端测试
- **Deploy workflow**: `.github/workflows/deploy.yml` — CI 通过后自动构建并部署到服务器
- **手动触发**: 支持 `workflow_dispatch`，可在 GitHub Actions 页面手动运行 Deploy

### GitHub Secrets

| Secret | 说明 |
|--------|------|
| `SERVER_SSH_KEY` | SSH 私钥（ed25519） |
| `SERVER_HOST` | `121.43.69.144` |
| `SERVER_USER` | `root` |
| `SERVER_ENV` | 生产 .env 原始内容 |
| `SERVER_KNOWN_HOSTS` | 服务器 SSH host key |

**当生产 .env 变更时**，需更新 GitHub Secret `SERVER_ENV`：
```bash
gh secret set SERVER_ENV < /path/to/new/.env
```

## Prisma CLI Path

The server uses pnpm with strict hoisting. The `prisma` binary is NOT in the global PATH. Use the full resolved path:

```bash
# First, find the exact path on the server:
PRISMA_BIN=$(find /home/violet/server/node_modules/.pnpm -path '*/prisma@*/node_modules/prisma/build/index.js' | head -1)

# Then use it:
node $PRISMA_BIN generate
node $PRISMA_BIN migrate deploy
```

Always resolve `PRISMA_BIN` at runtime rather than hardcoding the path (it includes version numbers that change on `pnpm install`).

## Modes

### `full` — Full update (both frontend and backend)

1. **Detect changes**: Run `git diff --name-only HEAD~1` (or against last deployed commit) to confirm both frontend and backend have changes. If only one side changed, suggest the appropriate single mode.

2. **Build locally**:
   ```bash
   cd <project-root>/server && pnpm build
   cd <project-root>/client && pnpm build
   ```

3. **Package and upload**:
   ```bash
   # Backend archive
   tar czf /tmp/violet-server.tar.gz -C <project-root>/server dist prisma package.json pnpm-lock.yaml
   scp -i ~/.ssh/violet-deploy /tmp/violet-server.tar.gz root@121.43.69.144:/home/violet/server/

   # Frontend archive
   tar czf /tmp/violet-client.tar.gz -C <project-root>/client dist
   scp -i ~/.ssh/violet-deploy /tmp/violet-client.tar.gz root@121.43.69.144:/home/violet/client/
   ```

4. **SSH and deploy**:
   ```bash
   ssh -i ~/.ssh/violet-deploy root@121.43.69.144
   cd /home/violet/server && tar xzf violet-server.tar.gz && rm violet-server.tar.gz
   pnpm install --prod
   PRISMA_BIN=$(find node_modules/.pnpm -path '*/prisma@*/node_modules/prisma/build/index.js' | head -1)
   node $PRISMA_BIN generate
   node $PRISMA_BIN migrate deploy
   pm2 restart violet-api
   cd /home/violet/client && tar xzf violet-client.tar.gz && rm violet-client.tar.gz
   ```

5. **Verify**: `curl -s -o /dev/null -w "%{http_code}" http://121.43.69.144/` and `http://121.43.69.144/api/` both return 200.

6. **Cleanup**: `rm /tmp/violet-server.tar.gz /tmp/violet-client.tar.gz`

### `backend` — Backend only

Same as `full` but only build/upload/deploy the server side. Skip frontend steps.

### `frontend` — Frontend only

Same as `full` but only build/upload the client side. Skip server steps. No restart needed — Nginx serves static files directly.

### `db` — Database migration only

No local build needed. SSH to server and run:
```bash
ssh -i ~/.ssh/violet-deploy root@121.43.69.144
cd /home/violet/server
PRISMA_BIN=$(find node_modules/.pnpm -path '*/prisma@*/node_modules/prisma/build/index.js' | head -1)
node $PRISMA_BIN migrate deploy
```

### `status` — Check server health

Run these checks and report results:
```bash
ssh -i ~/.ssh/violet-deploy root@121.43.69.144 "pm2 status && curl -s -o /dev/null -w 'Frontend: %{http_code}\n' http://localhost/ && curl -s -o /dev/null -w 'API: %{http_code}\n' http://localhost/api/ && redis-cli ping && psql -U violet -d violet -h localhost -c 'SELECT 1' -t && df -h /"
```

### `rollback` — Emergency rollback

If the new deployment is broken:
```bash
ssh -i ~/.ssh/violet-deploy root@121.43.69.144 "pm2 restart violet-api --update-env"
# If still broken, check logs:
ssh -i ~/.ssh/violet-deploy root@121.43.69.144 "pm2 logs violet-api --lines 30 --nostream"
```

For frontend rollback, restore the previous `dist/` from backup or re-upload from a known-good commit.

### `logs` — View server logs

```bash
ssh -i ~/.ssh/violet-deploy root@121.43.69.144 "pm2 logs violet-api --lines 50 --nostream"
```

## Auto-Detection Logic

If no mode is specified:

1. Check `git status` and `git diff --name-only` to see what changed
2. If only `client/` files changed → suggest `frontend`
3. If only `server/` files changed → suggest `backend`
4. If `server/prisma/` changed → note that `db` migration will be needed
5. If both changed → suggest `full`
6. If nothing changed → suggest `status` to check current state

## SSH Handling

SSH 优先使用密钥认证（`~/.ssh/violet-deploy`），密码认证作为备用。

- **密钥认证（优先）**: `ssh -i ~/.ssh/violet-deploy root@121.43.69.144`
- **密码认证（备用）**: 需要 expect 脚本自动化

Example expect helper (create at `/tmp/violet-ssh.exp`):
```expect
#!/usr/bin/expect -f
set timeout 30
set cmd [lindex $argv 0]
spawn ssh -o StrictHostKeyChecking=no root@121.43.69.144 $cmd
expect "password:" { send "$env(VIOLET_SSH_PASS)\r"; exp_continue }
expect eof
```

## Common Pitfalls & Troubleshooting

### 1. 打包时工作目录错误（前端打成了后端 dist）

**症状**: 部署后前端页面没有更新，缺少新功能。`/home/violet/client/dist/` 里出现 `src/`、`generated/`、`prisma/`、`tsconfig.build.tsbuildinfo` 等后端文件。

**原因**: `tar` 命令的工作目录还在 `server/`，`tar czf ... dist` 打包了后端的 `dist/` 而非前端的。

**预防**: 始终用 `-C` 参数显式指定目录：
```bash
tar czf /tmp/violet-client.tar.gz -C /Users/cumulo/Projects/Violet/client dist
tar czf /tmp/violet-server.tar.gz -C /Users/cumulo/Projects/Violet/server dist prisma package.json pnpm-lock.yaml
```

**验证**: 打包后检查文件大小，前端压缩包约 140K，后端约 260K。上传后检查服务器 dist 内容：
```bash
ssh -i ~/.ssh/violet-deploy root@121.43.69.144 "ls /home/violet/client/dist/"
# 应只有: assets/ favicon.svg index.html
```

### 2. 多个后端进程同时运行导致 500 错误

**症状**: API 返回 500，日志显示 `TypeError: Cannot read properties of undefined (reading 'register')` 或其他 DI 注入失败。

**原因**: `tsx watch`、`nest start --watch` 等多个进程同时占用端口，热重载不完整导致 NestJS 依赖注入失败。

**解决**: 杀掉所有后端进程后重新启动：
```bash
# 查找并杀掉
ps aux | grep -E "tsx|nest.*watch|node.*main" | grep -v grep | awk '{print $2}' | xargs kill 2>/dev/null
# 干净构建启动
cd <project-root>/server && npx nest build && node dist/src/main.js
```

### 3. 本地测试时 SSH 隧道断开

**症状**: `ECONNREFUSED` 连接 localhost:15432 或 localhost:16379。

**原因**: SSH 隧道进程被杀死或超时断开。

**解决**: 重建隧道：
```bash
# PostgreSQL 隧道
ssh -L 15432:localhost:5432 -N -f root@121.43.69.144

# Redis 隧道
ssh -L 16379:localhost:6379 -N -f root@121.43.69.144
```

### 4. Prisma migration 本地 vs 服务器不一致

**症状**: 本地能跑但服务器 `prisma migrate deploy` 报错，或反过来。

**原因**: 本地开发时可能用 `prisma migrate dev` 生成了新 migration 但没有 push 到 git，服务器代码里没有对应的 migration 文件。

**解决**: 确保 `server/prisma/migrations/` 目录下的所有 migration 文件都已提交并推送到 git。

### 5. pm2 重启后 API 仍返回旧响应

**症状**: 部署新代码后 `pm2 restart` 完成，但 API 行为没变。

**原因**: pm2 可能缓存了旧的代码，或 `--update-env` 未传递环境变量。

**解决**:
```bash
pm2 restart violet-api --update-env
# 如果还不行，完全删除重启：
pm2 delete violet-api && pm2 start dist/src/main.js --name violet-api
```

### 6. 前端 Socket.io 在开发环境连接失败

**症状**: 浏览器控制台 `WebSocket connection to 'ws://localhost:5173/socket.io/' failed`。

**原因**: Vite dev server 只代理了 `/api`，没有代理 `/socket.io` 路径，Socket.io 连到了前端端口而非后端 3000。

**解决**: `client/vite.config.ts` 中添加 `/socket.io` 代理：
```ts
proxy: {
  '/api': { target: 'http://localhost:3000', changeOrigin: true },
  '/socket.io': { target: 'http://localhost:3000', ws: true },
},
```

### 7. macOS 打包产物包含 `._` 文件

**症状**: 服务器解压后大量 `tar: Ignoring unknown extended header keyword 'LIBARCHIVE.xattr.com.apple.provenance'` 警告。

**影响**: 不影响功能，只是 macOS 的资源分叉文件（`._` 前缀）。可用 `COPYFILE_DISABLE=1` 环境变量避免：
```bash
COPYFILE_DISABLE=1 tar czf /tmp/violet-client.tar.gz -C <project-root>/client dist
```

## Guardrails

- **Never modify `.env` without user confirmation** — it contains secrets
- **Never run `prisma migrate reset`** on production — it drops all data
- **Always build locally** before uploading — don't install dev dependencies on server
- **Always verify** after deployment (HTTP 200 checks)
- **Show the user what will happen** before executing SSH commands
- **If a step fails, stop and report** — don't continue with partial deployment
- **Don't commit the deploy scripts** to git (they're temporary)
- **Clean up** temporary tar files after deployment
- **Always use `-C` flag with tar** to avoid wrong working directory issues
