## Context

邮件验证码基础设施（MailService + Redis + DirectMail）已在 email-verification change 中实现。密码重置复用同一套基础设施，无需引入新依赖。

## Goals / Non-Goals

**Goals:**
- 用户通过注册邮箱接收验证码，验证后设置新密码
- 登录页提供"忘记密码"入口
- 邮箱输入优化：学号 + 自动后缀

**Non-Goals:**
- 独立的密码重置邮件模板（复用同一验证码邮件）
- 旧密码验证（忘记密码场景无需旧密码）

## Decisions

### 1. 复用 send-code 接口

`POST /auth/send-code` 已存在，直接复用。验证码 key 格式 `verify:{email}`，密码重置和注册共用同一个 key，互斥（同一时刻只能做一种操作）。

对于用户来说这不是问题——忘记密码和注册不会同时发生。

### 2. reset-password 接口设计

```
POST /auth/reset-password
Body: { email, code, newPassword }
```

流程：验证码校验 → 查找用户 → 更新密码 hash → 删除验证码 key

### 3. 邮箱输入优化方案

登录页和注册页的邮箱输入改为：用户只输入学号（`@` 前面部分），后缀 `@smail.nju.edu.cn` 显示在输入框右侧作为后缀标签。前端提交时拼接完整邮箱。

## Risks / Trade-offs

- **[验证码共用 key]** → 注册和重置共用 `verify:{email}`，同一邮箱同一时刻只能做一种操作。实际风险极低。
- **[未注册邮箱发送验证码]** → send-code 不检查邮箱是否已注册（注册场景需要），重置密码时才检查。会向未注册邮箱发送验证码但无法完成重置，浪费少量额度但无安全风险。
