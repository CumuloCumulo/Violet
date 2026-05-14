## 1. 后端：密码重置接口

- [x] 1.1 在 `AuthService` 中新增 `resetPassword(email, code, newPassword)` 方法：校验验证码 → 查找用户 → 更新密码 hash → 删除 Redis key
- [x] 1.2 在 `AuthController` 中新增 `POST /auth/reset-password` 端点

## 2. 前端：密码重置页面

- [x] 2.1 在 `authStore` 中新增 `resetPassword(email, code, newPassword)` 方法
- [x] 2.2 新建 `ResetPasswordPage.tsx`：学号输入 + 后缀标签 + 发送验证码 + 验证码输入 + 新密码输入 + 提交
- [x] 2.3 在 `App.tsx` 的 ProdApp 路由中添加 `/reset-password` 路由

## 3. 前端：登录页改造

- [x] 3.1 修改 `LoginPage.tsx`：添加"忘记密码？"链接指向 `/reset-password`
- [x] 3.2 修改 `LoginPage.tsx`：邮箱输入改为学号输入 + 自动拼接 `@smail.nju.edu.cn` 后缀

## 4. 前端：注册页邮箱后缀优化

- [x] 4.1 修改 `RegisterPage.tsx`：邮箱输入改为学号输入 + 自动拼接 `@smail.nju.edu.cn` 后缀
