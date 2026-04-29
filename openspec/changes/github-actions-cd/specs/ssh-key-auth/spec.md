## ADDED Requirements

### Requirement: SSH 密钥对生成
系统 SHALL 生成 ed25519 类型的 SSH 密钥对，用于 GitHub Actions 与生产服务器之间的认证。

#### Scenario: 生成密钥对
- **WHEN** 在本地执行 `ssh-keygen -t ed25519 -C "github-actions-violet"`
- **THEN** 生成私钥和公钥文件，私钥存入 GitHub Secrets（`SERVER_SSH_KEY`），公钥添加到服务器 `/root/.ssh/authorized_keys`

#### Scenario: 从 GitHub Actions 连接服务器
- **WHEN** GitHub Actions workflow 使用存储的 SSH 私钥连接服务器
- **THEN** 连接成功，无需输入密码

### Requirement: 服务器 authorized_keys 配置
服务器 SHALL 在 `/root/.ssh/authorized_keys` 中添加部署公钥，允许 GitHub Actions 使用密钥认证登录。

#### Scenario: 添加公钥到服务器
- **WHEN** 将公钥内容追加到 `/root/.ssh/authorized_keys`
- **THEN** 使用对应私钥的 SSH 连接可以免密登录 root 用户

#### Scenario: SSH 连接安全性
- **WHEN** SSH 密钥认证配置完成
- **THEN** 密码认证仍保留作为备用方式，不关闭密码登录
