## Context

当前 Violet 已有 GitHub Actions CI（`.github/workflows/ci.yml`），在 push 到 main/dev 和 PR 时运行前端构建 + 后端构建 + 后端测试。但部署仍需手动操作：本地构建 → tar 打包 → scp 上传 → ssh 执行更新命令。

服务器环境：
- 阿里云 ECS，Ubuntu 24.04，IP 121.43.69.144
- SSH 密码认证（root 用户）
- pnpm strict hoisting，Prisma CLI 不在全局 PATH
- pm2 守护后端进程 `violet-api`
- Nginx 托管前端静态文件 + 反向代理 API

## Goals / Non-Goals

**Goals:**
- push 到 main 后自动触发部署，CI 通过即部署
- 使用 SSH 密钥认证，私钥存储在 GitHub Secrets
- 部署失败时有明确的通知和日志
- 支持数据库迁移（仅在有新 migration 时执行）

**Non-Goals:**
- 不做蓝绿部署或金丝雀发布
- 不做自动回滚（提供手动回滚指南）
- 不支持 dev 分支自动部署（仅 main）
- 不处理 Docker 化

## Decisions

### 1. SSH 密钥 vs 密码认证

**选择：SSH 密钥**

密钥认证更安全、更适合 CI/CD 环境。密码认证需要 `sshpass` 等工具，且密码泄露风险更高。在本地生成 ed25519 密钥对，公钥添加到服务器 `authorized_keys`，私钥存入 GitHub Secrets。

### 2. 单独 workflow vs 扩展 ci.yml

**选择：单独 workflow `deploy.yml`**

使用 `workflow_run` 触发器依赖 CI 完成后再部署。这样 CI 和 CD 职责分离，CI 可以独立在 PR 上运行，CD 仅在 main 的 CI 通过后触发。

### 3. 部署方式：rsync vs scp+tar

**选择：scp + tar（与现有流程一致）**

当前手动部署用 tar + scp，已在 `.claude/skills/violet-deploy/SKILL.md` 中验证。保持一致避免引入新问题。rsync 需要额外安装，且增量同步在有 Prisma generate 需求时不可靠。

### 4. 构建位置：GitHub Actions runner

**选择：在 GitHub Actions runner 上构建**

runner 是 Ubuntu 环境，Node.js + pnpm 已通过 actions/setup-node 和 pnpm/action-setup 配置。构建后打包上传到服务器，服务器只做 `pnpm install --prod`、`prisma generate`、`prisma migrate deploy`、`pm2 restart`。

## Risks / Trade-offs

- **[SSH 密钥泄露]** → 私钥仅存于 GitHub Secrets，不在代码中出现。可随时在服务器端删除公钥来撤销。
- **[部署失败导致服务中断]** → pm2 restart 如果新代码有 bug，服务会 crash。缓解：CI 已有 lint + build + test gate。
- **[Prisma migration 失败]** → `migrate deploy` 只执行未应用的迁移，不会重置。如果迁移有冲突，部署会停止但数据库不受影响。
- **[GitHub Secrets 中的 .env 内容]** → 需要将生产环境变量以 base64 编码存入 Secret，部署时解码写入服务器 .env。

## Migration Plan

1. 在本地生成 SSH 密钥对
2. 公钥添加到服务器 `/root/.ssh/authorized_keys`
3. 在 GitHub 仓库配置 Secrets：`SERVER_SSH_KEY`、`SERVER_HOST`、`SERVER_USER`、`SERVER_ENV_B64`
4. 创建 `.github/workflows/deploy.yml`
5. 测试：push 到 main，观察 GitHub Actions 运行结果
6. 确认部署成功后，SSH 密码登录仍保留作为备用

回滚：SSH 到服务器执行 `pm2 restart violet-api --update-env`，或手动上传已知好的构建产物。
