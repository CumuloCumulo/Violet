## Context

Violet 注册流程目前仅通过 `email.endsWith('@smail.nju.edu.cn')` 检查邮箱后缀，无法验证邮箱所有权。阿里云 DirectMail 已就绪（域名 njuviolet.com 已验证、发信地址 cumulo@njuviolet.com 已创建），nodemailer 已安装。服务器已有 ioredis 实例（chat 模块在使用）。

## Goals / Non-Goals

**Goals:**
- 注册时验证邮箱所有权：用户收到验证码邮件后才能完成注册
- 复用现有 ioredis 存储验证码，天然 TTL 过期
- 封装独立的 MailModule，后续可扩展（密码重置、通知邮件等）

**Non-Goals:**
- 密码重置流程（本次不涉及）
- 邮件模板美化（先用纯文本验证码）
- 验证码频率限制（初期用户量极小，不做 rate limiting）

## Decisions

### 1. 验证码存储：Redis String + TTL

```
Key:    verify:{email}
Value:  6位数字验证码
TTL:    300秒 (5分钟)
```

**选择理由**：Redis 已在项目中使用（ioredis），String 类型足够简单，TTL 天然过期无需清理。
**替代方案**：数据库表 — 需要新建 Prisma model + 定时清理，过度设计。

### 2. MailModule 结构

新建 `server/src/mail/` 目录：

```
mail/
├── mail.module.ts      ← MailModule (global)
└── mail.service.ts     ← MailService
```

- `MailModule` 注册为全局模块，任何地方都可以注入 `MailService`
- `MailService` 启动时创建 nodemailer transporter，复用连接
- 阿里云 DirectMail SMTP: `smtpdm.aliyun.com:465` (SSL)

### 3. 验证码注册流程（两步）

```
Step 1: POST /auth/send-code { email }
        → 校验后缀 → 生成6位码 → SET verify:{email} EX 300 → 发邮件

Step 2: POST /auth/register { email, nickname, password, code }
        → GET verify:{email} → 比对 → DEL key → 创建用户
```

**不做图形验证码** — 收件人限定 `@smail.nju.edu.cn`，被刷风险极低。

### 4. Redis 实例复用方式

在 `MailModule` 或 `AuthService` 中直接 `new Redis()` 创建新的 Redis 连接（与 chat 模块平行的模式）。不抽取共享 RedisModule —— 当前仅两个使用点，不值得抽象。

## Risks / Trade-offs

- **[阿里云 DirectMail 免费额度]** → 新账户 200 封/天，学生项目完全够用。超出后可升级付费版。
- **[验证码暴力破解]** → 6位数字有 100万种组合，5分钟 TTL 内实际风险极低（收件人限定 smail 邮箱）。如需加固，后续可加失败次数锁定。
- **[邮件进垃圾箱]** → 阿里云 DirectMail 在国内送达率良好，且 SPF/DKIM 已配置。首次发送可能被标记，用户需检查垃圾箱。
- **[前端注册页 BREAKING 变更]** → 注册接口新增必填 `code` 字段，前后端必须同步部署。
