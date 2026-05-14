## 1. MailModule 基础设施

- [x] 1.1 新建 `server/src/mail/mail.service.ts`：创建 MailService，初始化 nodemailer transporter（使用 `SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_USER`/`SMTP_PASS` 环境变量），实现 `sendVerificationCode(to: string, code: string)` 方法
- [x] 1.2 新建 `server/src/mail/mail.module.ts`：创建 MailModule（global），注册 MailService
- [x] 1.3 更新 `.env.example`：将 SMTP 配置替换为阿里云 DirectMail 的值（`smtpdm.aliyun.com`、`465`、`cumulo@njuviolet.com`）

## 2. 验证码发送接口

- [x] 2.1 在 `AuthService` 中注入 ioredis 实例（`new Redis({ host, port })`），实现 `sendCode(email)` 方法：校验邮箱后缀 → 生成 6 位随机码 → `SET verify:{email} {code} EX 300` → 调用 `MailService.sendVerificationCode`
- [x] 2.2 在 `AuthController` 中新增 `POST /auth/send-code` 端点，接收 `{ email }`，调用 `AuthService.sendCode`
- [x] 2.3 在 `AuthModule` 中 import MailModule

## 3. 注册接口改造

- [x] 3.1 修改 `AuthService.register`：新增 `code` 参数，从 Redis `GET verify:{email}` 取值比对，不匹配或不存在则抛出 400 错误 `验证码错误或已过期`，匹配后 `DEL key`
- [x] 3.2 修改 `AuthController.register` 的 body 类型，增加 `code: string` 字段

## 4. 前端注册页改造

- [x] 4.1 在 `authStore` 中新增 `sendCode(email)` 方法，调用 `POST /auth/send-code`
- [x] 4.2 修改 `register()` 方法，增加 `code` 参数传入
- [x] 4.3 改造 `RegisterPage.tsx`：在邮箱输入框旁添加"发送验证码"按钮，新增验证码输入框，实现 60 秒倒计时逻辑
- [x] 4.4 调整注册提交逻辑：校验验证码已填写后调用 `register(email, nickname, password, code)`

## 5. 环境配置与测试

- [x] 5.1 更新生产环境 `.env`：添加阿里云 DirectMail SMTP 配置（通过 `ssh` 更新服务器，同时更新 GitHub Secret `SERVER_ENV`）
- [ ] 5.2 本地测试：通过 SSH 隧道连接 Redis，运行后端，调用 `POST /auth/send-code` 验证邮件是否收到
- [ ] 5.3 端到端测试：在注册页完成 邮箱 → 发验证码 → 输入验证码 → 注册 的完整流程
