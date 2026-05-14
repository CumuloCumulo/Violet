## Why

用户忘记密码后无法找回，只能联系管理员手动重置。需要提供自助密码重置功能，通过注册邮箱发送验证码来验证身份后设置新密码。同时优化登录和注册页的邮箱输入体验，自动补全 `@smail.nju.edu.cn` 后缀。

## What Changes

- 新增 `POST /auth/reset-password` 接口：验证邮箱验证码后更新密码
- 复用 `send-code` 接口发送重置验证码（同一邮箱可收到注册/重置验证码）
- 新增 `ResetPasswordPage` 前端页面，从登录页"忘记密码"链接进入
- 登录页和注册页邮箱输入框优化：用户只输入学号部分，自动拼接 `@smail.nju.edu.cn`

## Capabilities

### New Capabilities

- `password-reset`: 密码重置流程——发送验证码到注册邮箱、验证后设置新密码

### Modified Capabilities

（无）

## Impact

- **后端**: `auth.controller.ts` 新增 `POST /auth/reset-password`；`auth.service.ts` 新增 `resetPassword` 方法
- **前端**: 新增 `ResetPasswordPage.tsx`；修改 `LoginPage.tsx` 添加"忘记密码"入口；`App.tsx` 添加路由；`authStore.ts` 新增方法
- **邮箱输入优化**: `LoginPage.tsx` 和 `RegisterPage.tsx` 的邮箱输入改为学号+后缀自动拼接
