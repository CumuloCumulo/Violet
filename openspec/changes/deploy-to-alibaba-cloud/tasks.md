## 1. 阿里云安全组配置

- [x] 1.1 在阿里云控制台为安全组 `sg-bp17bw7623shtw5l49sr` 添加入方向规则：允许 TCP 80 端口，源地址 0.0.0.0/0

## 2. 服务器基础环境搭建

- [x] 2.1 SSH 登录服务器 `ssh root@121.43.69.144`，执行 `apt update && apt upgrade -y`
- [x] 2.2 安装 PostgreSQL：`apt install -y postgresql postgresql-contrib`，确认服务启动
- [x] 2.3 安装 Redis：`apt install -y redis-server`，确认 `redis-cli ping` 返回 PONG
- [x] 2.4 安装 Nginx：`apt install -y nginx`，确认 `http://121.43.69.144` 返回欢迎页
- [x] 2.5 安装 Node.js 22：通过 NodeSource 脚本安装
- [x] 2.6 安装 pnpm 和 pm2：`npm install -g pnpm pm2`

## 3. 数据库配置

- [x] 3.1 创建 PostgreSQL 用户和数据库：`sudo -u postgres createuser violet`，`sudo -u postgres createdb violet -O violet`
- [x] 3.2 设置 violet 用户密码：`sudo -u postgres psql -c "ALTER USER violet PASSWORD '<secure-password>';"`
- [x] 3.3 验证连接：`psql -U violet -d violet -h localhost` 能成功登录

## 4. 代码部署 — 后端

- [x] 4.1 在服务器创建 `/home/violet/server/` 目录
- [x] 4.2 本地执行 `cd server && pnpm build`，将 `dist/`、`prisma/`、`package.json`、`pnpm-lock.yaml` 通过 scp 上传到服务器
- [x] 4.3 服务器执行 `cd /home/violet/server && pnpm install --prod`
- [x] 4.4 服务器执行 `npx prisma migrate deploy` 应用数据库迁移
- [x] 4.5 创建 `/home/violet/server/.env`，填入 `DATABASE_URL`、`REDIS_HOST=localhost`、`REDIS_PORT=6379`、`JWT_SECRET`（随机强密码）、`CORS_ORIGIN=http://121.43.69.144`、`PORT=3000`

## 5. 代码调整 — 前端 Socket.io 连接

- [x] 5.1 修改 `client/src/stores/chatStore.ts` 的 `connect` 方法：默认连接地址改为当前 origin（不指定端口），使 Socket.io 走 Nginx 代理

## 6. 代码调整 — 后端 CORS 配置

- [x] 6.1 确认 `server/src/chat/chat.gateway.ts` 已支持 `CORS_ORIGIN` 环境变量（当前代码已实现），验证生产环境 `.env` 中 `CORS_ORIGIN` 已设置

## 7. 代码部署 — 前端

- [x] 7.1 本地执行 `cd client && pnpm build`，将 `dist/` 目录通过 scp 上传到服务器 `/home/violet/client/dist/`

## 8. Nginx 配置

- [x] 8.1 创建 Nginx 站点配置文件 `/etc/nginx/sites-available/violet`，配置前端静态文件、API 反向代理、WebSocket 代理
- [x] 8.2 创建符号链接启用站点：`ln -s /etc/nginx/sites-available/violet /etc/nginx/sites-enabled/`
- [x] 8.3 删除或禁用默认站点配置：`rm /etc/nginx/sites-enabled/default`
- [x] 8.4 测试 Nginx 配置：`nginx -t`，确认语法正确后 `systemctl reload nginx`

## 9. 启动后端服务

- [x] 9.1 启动 NestJS：`cd /home/violet/server && pm2 start dist/main.js --name violet-api`
- [x] 9.2 保存 pm2 进程列表：`pm2 save`
- [x] 9.3 设置 pm2 开机自启：`pm2 startup` 并执行输出的命令

## 10. 验证部署

- [x] 10.1 浏览器访问 `http://121.43.69.144`，确认前端页面正常加载
- [x] 10.2 测试 API 请求：访问 `http://121.43.69.144/api/...` 确认后端响应正常
- [x] 10.3 测试 WebSocket：进入聊天页面，确认 Socket.io 连接成功
- [x] 10.4 测试 SPA 路由：直接访问 `http://121.43.69.144/discovery`，确认不返回 404
- [ ] 10.5 更改服务器 SSH 密码（密码已在聊天记录中暴露）
