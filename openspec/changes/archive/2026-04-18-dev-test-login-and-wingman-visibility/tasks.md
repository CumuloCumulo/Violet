## 1. 后端 DEV API

- [x] 1.1 创建 `server/src/dev/dev.controller.ts` — 添加 `GET /api/dev/users` 端点，返回所有用户的 id、nickname、gender、campus、roles；添加 `GET /api/dev/relationships` 端点，返回所有 ICEBREAKING 关系及其成员和军师分配信息
- [x] 1.2 创建 `server/src/dev/dev.module.ts` — 注册 DevController，使用 PrismaService 查询数据
- [x] 1.3 在 `server/src/app.module.ts` 中注册 DevModule — 使用条件导入确保仅开发环境加载

## 2. chatStore 模式状态同步

- [x] 2.1 更新 `chatStore.ts` 的 RoomState 接口 — 确保 `wingmanMode1` 和 `wingmanMode2` 字段存在并可被 socket 事件更新
- [x] 2.2 更新 `modeSwitched` 事件回调 — 从 console.log 改为更新 store 中对应聊天室的 wingmanMode（根据 wingmanId 匹配 side 1 或 side 2）
- [x] 2.3 更新 `roomJoined` 事件回调 — 从服务端返回的数据中提取并存储 wingmanMode1/wingmanMode2 到 rooms state

## 3. ChatPage 军师可见性修复

- [x] 3.1 修改 `ChatPage.tsx` 读取 wingmanMode — 从 chatStore 读取当前聊天室的 wingmanMode 而非依赖 prop
- [x] 3.2 修改军师端 `showMainPanel` 逻辑 — 军师根据自身 mode 决定：PRIVATE 隐藏主窗口，ASSIST/SOLO 显示主窗口
- [x] 3.3 修改当事人端模式切换器 — 从 store 读取当前高亮状态，切换后本地 UI 立即响应

## 4. DEV 登录页重构

- [x] 4.1 创建 `client/src/hooks/useDevData.ts` — 封装 fetch `/api/dev/users` 和 `/api/dev/relationships` 的 hook，返回用户列表和聊天室列表
- [x] 4.2 重构 `App.tsx` DEV_MODE 分支 — 将三个输入框替换为三步选择 UI：Step 1 身份选择（当事人/军师卡片）、Step 2 用户选择（根据身份过滤的用户卡片列表）、Step 3 聊天室选择（根据用户过滤的聊天室卡片列表）
- [x] 4.3 实现自动参数计算 — 选好用户和聊天室后自动计算出 userId、relationshipId、wingmanId，传入 ChatPage
- [x] 4.4 保持非 DEV 模式兼容 — 保留原有输入框逻辑用于非开发环境，确保不影响未来正式登录页开发
