## ADDED Requirements

### Requirement: CI 通过后自动触发部署
系统 SHALL 在 CI workflow 对 main 分支成功完成后，自动触发 CD 部署 workflow。

#### Scenario: main 分支 push 触发部署
- **WHEN** 代码 push 到 main 分支，且 CI workflow（构建 + 测试）全部通过
- **THEN** 自动触发 deploy workflow，开始部署流程

#### Scenario: CI 失败不触发部署
- **WHEN** CI workflow 中任何一个 job 失败
- **THEN** deploy workflow 不被触发

#### Scenario: PR 不触发部署
- **WHEN** 创建或更新 Pull Request
- **THEN** 仅运行 CI，不触发部署

### Requirement: 自动构建前后端
deploy workflow SHALL 在 GitHub Actions runner 上构建前端和后端代码。

#### Scenario: 后端构建
- **WHEN** deploy workflow 开始执行
- **THEN** 安装后端依赖、运行 `prisma generate`、执行 `pnpm build`，产出 `dist/` 目录

#### Scenario: 前端构建
- **WHEN** deploy workflow 开始执行
- **THEN** 安装前端依赖、执行 `pnpm build`，产出 `dist/` 目录

### Requirement: 自动上传并部署到服务器
deploy workflow SHALL 将构建产物上传到服务器并执行更新命令。

#### Scenario: 后端部署
- **WHEN** 构建产物上传完成
- **THEN** 解压后端代码到 `/home/violet/server/`，执行 `pnpm install --prod`、`prisma generate`、`prisma migrate deploy`、`pm2 restart violet-api`

#### Scenario: 前端部署
- **WHEN** 构建产物上传完成
- **THEN** 解压前端代码到 `/home/violet/client/dist/`，Nginx 自动提供新版本静态文件

#### Scenario: 数据库迁移
- **WHEN** `prisma/migrations` 目录中有新的迁移文件
- **THEN** 执行 `prisma migrate deploy` 应用新迁移

#### Scenario: 无新迁移
- **WHEN** 所有迁移已应用
- **THEN** `prisma migrate deploy` 输出 "No pending migrations"，继续部署

### Requirement: GitHub Secrets 配置
deploy workflow 所需的敏感信息 SHALL 存储在 GitHub Secrets 中。

#### Scenario: 必需的 Secrets
- **WHEN** 配置 deploy workflow
- **THEN** 以下 Secrets 已设置：`SERVER_SSH_KEY`（SSH 私钥）、`SERVER_HOST`（服务器 IP）、`SERVER_USER`（SSH 用户名）、`SERVER_ENV_B64`（生产 .env 的 base64 编码）

### Requirement: 部署验证
deploy workflow SHALL 在部署完成后验证服务可用性。

#### Scenario: 前端验证
- **WHEN** 部署步骤完成
- **THEN** 对 `http://<SERVER_HOST>/` 发起请求，HTTP 状态码为 200

#### Scenario: API 验证
- **WHEN** 部署步骤完成
- **THEN** 对 `http://<SERVER_HOST>/api/` 发起请求，HTTP 状态码为 200

#### Scenario: 部署失败处理
- **WHEN** 任何部署步骤失败
- **THEN** workflow 标记为失败，GitHub 显示错误日志，不继续后续步骤
