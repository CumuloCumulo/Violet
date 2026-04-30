## 1. SSH 密钥配置

- [x] 1.1 在本地生成 ed25519 SSH 密钥对（`ssh-keygen -t ed25519 -C "github-actions-violet" -f ~/.ssh/violet-deploy`）
- [x] 1.2 将公钥添加到服务器 `/root/.ssh/authorized_keys`（通过 SSH 用密码认证登录）
- [x] 1.3 验证密钥登录可用：`ssh -i ~/.ssh/violet-deploy root@121.43.69.144 "echo ok"`

## 2. GitHub Secrets 配置

- [x] 2.1 在 GitHub 仓库 `CumuloCumulo/Violet` 的 Settings → Secrets 中添加 `SERVER_SSH_KEY`（私钥内容）
- [x] 2.2 添加 `SERVER_HOST` = `121.43.69.144`
- [x] 2.3 添加 `SERVER_USER` = `root`
- [x] 2.4 将服务器 `/home/violet/server/.env` 内容 base64 编码后添加为 `SERVER_ENV_B64`
- [x] 2.5 添加 `SERVER_KNOWN_HOSTS`（服务器的 SSH host key，通过 `ssh-keyscan` 获取）

## 3. 创建 Deploy Workflow

- [x] 3.1 创建 `.github/workflows/deploy.yml`，使用 `workflow_run` 触发器依赖 CI 完成后运行
- [x] 3.2 配置 SSH 密钥和 known_hosts
- [x] 3.3 添加后端构建步骤：install → prisma generate → build → tar 打包 → scp 上传
- [x] 3.4 添加前端构建步骤：install → build → tar 打包 → scp 上传
- [x] 3.5 添加服务器端部署步骤：解压 → pnpm install --prod → prisma generate → prisma migrate deploy → 写入 .env → pm2 restart
- [x] 3.6 添加部署验证步骤：curl 检查前端和 API 返回 200

## 4. 测试与验证

- [x] 4.1 提交 workflow 文件并 push 到 main，观察 GitHub Actions 运行结果
- [x] 4.2 确认 CI 通过后 deploy workflow 自动触发
- [x] 4.3 确认部署成功，浏览器访问 `http://121.43.69.144` 显示新版本
- [x] 4.4 确认 API 正常，`curl http://121.43.69.144/api/` 返回 200
