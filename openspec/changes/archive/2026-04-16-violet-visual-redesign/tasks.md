## 1. 设计系统基础

- [x] 1.1 更新 DESIGN.md：新增 "Violet Brand Extension" 章节，包含色彩体系（深紫基调、紫罗兰 accent、暖白文字）、氛围描述（"对话即心跳"）、组件样式覆盖规则
- [x] 1.2 更新 `client/src/index.css`：替换 `@theme` 中的色彩变量——将 `--color-apple-blue` 系列替换为 Violet 色彩体系（`--color-violet-accent: #8b5cf6`、`--color-deep-base: #0c0a14`、`--color-warm-white: #f5f0ff` 等），新增渐变背景和毛玻璃效果的工具类
- [x] 1.3 安装 `motion` 依赖（framer-motion 的新包名）用于微动效

## 2. 登录页重设计

- [x] 2.1 重写 `App.tsx` 登录页背景：从纯黑 `bg-near-black` 改为深紫渐变背景（`#0c0a14` → `#1a1028` → `#0c0a14`），实现径向渐变效果
- [x] 2.2 重写品牌展示区：品牌名 "Violet" 使用 SF Pro Display weight 300、至少 48px、letter-spacing -0.02em、暖白色；副标题使用半透明暖白色
- [x] 2.3 重写表单输入框样式：背景 `#1a1525`，边框 `rgba(139, 92, 246, 0.15)`，focus 时紫罗兰 ring，文字暖白色，placeholder 低透明度
- [x] 2.4 重写 CTA 按钮：紫罗兰背景 `#8b5cf6`，hover `#7c3aed`，暖白文字，disabled 态 opacity 0.3
- [x] 2.5 更新 DEV MODE 徽章：从 Apple Blue 色调改为紫罗兰色调（`rgba(139, 92, 246, 0.15)` 底 + `#a78bfa` 字）
- [x] 2.6 实现登录页入场动效：品牌名 fade-in（0ms, 600ms）→ 副标题 slide-up（200ms, 500ms）→ 表单 stagger-in（400ms 起, 间隔 100ms）→ 按钮 scale-in（800ms）

## 3. 聊天页导航栏

- [x] 3.1 重写 `ChatPage.tsx` 顶部导航栏：从 `bg-near-black/80` 改为紫调半透明 `rgba(12, 10, 20, 0.8)` + `backdrop-filter: blur(20px) saturate(180%)`，文字改为暖白色
- [x] 3.2 更新连接状态指示器：在线点使用翡翠绿 `#34d399`，文字改为 `rgba(245, 240, 255, 0.5)`

## 4. 聊天面板组件

- [x] 4.1 重写 `ChatPanel.tsx` 面板头部：背景 `#0f0d17`，标题暖白色，底部分隔线 `rgba(139, 92, 246, 0.1)`
- [x] 4.2 重写 `ChatPanel.tsx` 消息区域背景：从白色改为深紫黑 `#0c0a14`
- [x] 4.3 重写自己发送的消息气泡：紫罗兰底 `#8b5cf6` + 暖白字 `#f5f0ff`，圆角 20px，右对齐
- [x] 4.4 重写对方发送的消息气泡：深紫底 `#1f1b2e` + 浅紫字 `#e0d4f5`，圆角 20px，左对齐，发送者昵称半透明
- [x] 4.5 重写系统消息样式：紫罗兰半透明胶囊 `rgba(139, 92, 246, 0.15)` 底 + `#a78bfa` 文字
- [x] 4.6 重写待确认消息样式：琥珀色边框 `rgba(251, 191, 36, 0.3)` + 深色底，确认/拒绝按钮使用紫罗兰/中性色
- [x] 4.7 实现消息入场动效：新消息 slide-in（translateY 10px → 0）+ fade-in，duration 300ms

## 5. 输入区域

- [x] 5.1 重写 `MessageInput.tsx` 整体底色：从白色改为 `#0c0a14`，分隔线改为 `rgba(139, 92, 246, 0.1)`
- [x] 5.2 重写输入框样式：背景 `#1a1525`，文字暖白色，placeholder 低透明度，紫罗兰 focus ring
- [x] 5.3 重写发送按钮：紫罗兰圆形 `#8b5cf6`，hover `#7c3aed`，disabled 半透明
- [x] 5.4 重写表情选择器：深色底色，hover 态使用紫罗兰半透明高亮

## 6. 其他组件

- [x] 6.1 重写军师模式切换器：选中的 pill 为 `#8b5cf6` 底 + `#f5f0ff` 字，未选中为 `rgba(139, 92, 246, 0.1)` 底 + 半透明字
- [x] 6.2 重写 `PresenceIndicator.tsx`：头像圆形使用 `#1a1525` 底 + `#a78bfa` 首字母，在线点翡翠绿，文字半透明
- [x] 6.3 重写双面板分隔线：从灰色边框改为 `rgba(139, 92, 246, 0.15)`
