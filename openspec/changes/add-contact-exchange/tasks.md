## 1. 数据库与后端模型

- [x] 1.1 在 Prisma schema User 模型中新增 `phone String?` 字段，运行 migration
- [x] 1.2 UserController `updateProfile` body 类型新增 `wechat?`、`qq?`、`phone?` 字段

## 2. 前端类型与状态

- [x] 2.1 authStore AuthUser 接口新增 `wechat: string | null`、`qq: string | null`、`phone: string | null`

## 3. 前端 — 个人中心 UI

- [x] 3.1 ProfilePage "交换信息"折叠栏：微信号和QQ号输入框，自动保存，空值时提示"请至少填写一项"
- [x] 3.2 ProfilePage "账号安全"折叠栏：手机号输入框，自动保存
- [x] 3.3 新增折叠栏的 CSS 样式

## 4. 后端 — 暧昧期联系方式交换

- [x] 4.1 ChatLifecycleService `onFlirting()` 中查询双方用户的 wechat 和 qq
- [x] 4.2 生成系统消息包含双方联系方式，格式"🎉 联系方式已交换\nA的微信: xxx\nB的微信: yyy..."
- [x] 4.3 通过 socket 广播 `contactExchange` 事件，携带结构化数据（对方 wechat/qq）

## 5. 前端 — 暧昧期弹窗展示联系方式

- [x] 5.1 chatStore 接收 `contactExchange` socket 事件，存储对方联系方式数据
- [x] 5.2 ChatPage 暧昧期弹窗（isFlirting overlay）中展示对方微信号和QQ号，未设置显示"对方未设置"
- [x] 5.3 每个联系方式旁添加复制按钮，点击复制到剪贴板并显示 toast 提示

## 6. 测试与验证

- [x] 6.1 本地验证：个人中心填写微信号/QQ号/手机号 → 自动保存成功
- [ ] 6.2 本地验证：双方进入暧昧期 → 弹窗展示对方联系方式 → 复制按钮可用
- [x] 6.3 部署到服务器，运行 migration，重启后端
