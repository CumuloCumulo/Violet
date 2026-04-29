## Why

当前每次部署需要手动构建、打包、SCP 上传、SSH 登录执行更新命令，过程繁琐且容易遗漏步骤。通过 GitHub Actions 实现 push 到 main 后自动部署，消除手动操作，确保每次代码变更都能可靠地同步到生产服务器。

## What Changes

- 新增 GitHub Actions CD workflow（`.github/workflows/deploy.yml`），在 CI 通过后自动触发部署
- 在阿里云服务器上配置 SSH 密钥认证（替代当前密码认证），供 GitHub Actions 使用
- 需要在 GitHub 仓库中配置 Secrets（SSH 私钥、服务器地址等）
- 部署流程：本地无需构建 → GitHub Actions 中构建前后端 → 通过 SSH/SCP 部署到服务器

## Capabilities

### New Capabilities
- `ssh-key-auth`: 为服务器配置 SSH 密钥认证，生成 deploy key 并添加到 authorized_keys
- `cd-pipeline`: GitHub Actions CD 流水线，CI 通过后自动构建并部署到生产服务器

### Modified Capabilities

（无）

## Impact

- **新增文件**：`.github/workflows/deploy.yml`
- **服务器变更**：`/root/.ssh/authorized_keys` 添加公钥
- **GitHub Secrets**：需配置 `SERVER_HOST`、`SERVER_USER`、`SERVER_SSH_KEY`、`SERVER_ENV`（生产环境变量）
- **依赖**：现有 CI workflow（`ci.yml`）作为前置 gate
- **安全**：SSH 密钥对认证替代密码认证，私钥仅存于 GitHub Secrets
