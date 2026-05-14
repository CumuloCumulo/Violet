## Why

需求文档要求"双方互相同意进入暧昧期后，系统自动交换注册时的微信/QQ"，但目前暧昧期过渡（ICEBREAKING → FLIRTING）只做了军师退出和聊天室只读，**没有实现联系方式交换**。同时，个人中心缺少微信号、QQ号、手机号的编辑入口，用户无法填写这些信息。

## What Changes

- 个人中心新增"交换信息"折叠栏，包含微信号和QQ号输入框（自动保存），用于暧昧期自动交换
- 个人中心"账号安全"折叠栏内新增手机号输入框（仅自己可见，不参与交换）
- 后端 `updateProfile` 接口新增 `wechat`、`qq`、`phone` 字段支持
- Prisma schema User 模型新增 `phone String?` 字段（wechat/qq 已存在）
- `ChatLifecycleService.onFlirting()` 中查询双方 wechat/qq，通过系统消息 + socket 事件推送给双方
- 前端暧昧期弹窗展示对方联系方式，支持一键复制

## Capabilities

### New Capabilities
- `contact-exchange`: 暧昧期自动交换联系方式（微信/QQ）的完整流程，包含后端交换逻辑、socket 事件推送、前端展示与复制

### Modified Capabilities
<!-- 无已有 spec 需要修改 -->

## Impact

- **数据库**: User 表新增 `phone` 字段，需 migration
- **后端 API**: `PATCH /user/profile` body 新增 wechat/qq/phone 字段
- **后端逻辑**: `chat-lifecycle.service.ts` 的 `onFlirting()` 方法增加联系方式查询和推送
- **前端**: ProfilePage 新增两个折叠栏（交换信息 + 手机号），ChatPage 暧昧期弹窗展示联系方式
- **隐私**: wechat/qq/phone 不出现在 getPublicProfile、getAnonymousProfile、DiscoveryService.listUsers 中（现有结构已保证）
