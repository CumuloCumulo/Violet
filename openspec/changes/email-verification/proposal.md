## Why

当前注册仅检查邮箱后缀 `@smail.nju.edu.cn`，任何人都能伪造注册，无法保证用户真实身份。阿里云 DirectMail 已开通、域名 `njuviolet.com` 已验证、发信地址 `cumulo@njuviolet.com` 已就绪。需要实现邮箱验证码机制，让注册流程真正验证邮箱所有权。

## What Changes

- 新增 `POST /auth/send-code` 接口：接收邮箱地址，生成 6 位验证码，存入 Redis（TTL 5min），通过阿里云 DirectMail SMTP 发送验证码邮件
- 修改 `POST /auth/register` 接口：增加 `code` 参数，注册前必须验证邮箱验证码
- 新建 `MailModule` + `MailService`：封装 nodemailer SMTP 连接和邮件发送逻辑
- 前端注册页改造：增加"发送验证码"按钮和验证码输入框，分步完成注册

## Capabilities

### New Capabilities

- `email-verification`: 邮箱验证码发送与校验——覆盖验证码生成、Redis 存储、邮件发送、注册时校验的完整流程

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **后端代码**: `auth.module.ts`、`auth.controller.ts`、`auth.service.ts` 需要修改；新增 `mail/` 模块
- **前端代码**: `RegisterPage.tsx` 需要改造 UI 增加验证码步骤；`authStore.ts` 需要新增 `sendCode` 方法
- **依赖**: nodemailer 已安装；需确认 Redis 客户端（ioredis/redis）是否已安装
- **环境变量**: `.env` 需新增 `SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE`、`SMTP_USER`、`SMTP_PASS`、`SMTP_FROM`（替换原有的 NJU SMTP 配置）
- **API**: 注册接口参数变更（新增 `code` 字段）——**BREAKING**，需同步更新前端
