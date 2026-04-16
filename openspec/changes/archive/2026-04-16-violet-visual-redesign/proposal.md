## Why

当前前端界面虽然功能可用，但视觉上缺乏品牌识别度，像一个开发者工具而非面向大学生的恋爱社交产品。现有的 DESIGN.md 直接套用 Apple 网站的设计语言（纯黑底 + Apple Blue），对 Violet 的"校园恋爱代聊"定位来说过于冰冷和"企业化"。需要借鉴 Apple 的设计**原则**（高对比度、精准排版、毛玻璃效果、克制用色），同时为 Violet 定制一套温暖、年轻、带暧昧感的视觉语言，让产品从"能用"升级到"想用"。

## What Changes

- **重新定义 Violet 设计系统**：将 DESIGN.md 从纯 Apple 风格重新诠释为"对话即心跳"主题——保留 Apple 的排版精度和空间哲学，但用深紫/玫瑰色调替代冰冷纯黑，用紫罗兰/珊瑚色替代企业蓝
- **重设计登录页**：从纯黑底+表单升级为有品牌感、有氛围感的入口页面
- **重设计聊天页面**：从朴素工具化界面升级为精致的即时通讯体验，包含毛玻璃导航、精致气泡、优雅的面板分隔

## Capabilities

### New Capabilities

- `violet-design-system`: Violet 品牌视觉设计系统——色彩、排版、组件样式规范，从 Apple 设计原则中提炼并重新诠释
- `login-page-redesign`: 登录页面的视觉重设计，包含品牌展示、氛围营造、表单交互优化
- `chat-page-redesign`: 聊天页面的视觉重设计，包含导航栏、消息气泡、输入区、双面板布局的精致化

### Modified Capabilities

（无已有 capability 需要修改——这是新增的视觉层）

## Impact

- **DESIGN.md**：从 Apple 风格参考文档更新为 Violet 专属设计系统文档
- **client/src/index.css**：Tailwind 主题变量全面更新（色彩、字体、间距）
- **client/src/App.tsx**：登录页 JSX 和样式重写
- **client/src/pages/ChatPage.tsx**：聊天页布局和样式调整
- **client/src/components/ChatPanel.tsx**：消息气泡、面板头部样式升级
- **client/src/components/MessageInput.tsx**：输入区视觉精致化
- **client/src/components/PresenceIndicator.tsx**：在线状态指示器样式更新
- **前端依赖**：可能需要引入 `framer-motion`（或 `motion`）用于微动效
- **不影响**：后端代码、Socket.io 逻辑、Zustand store 逻辑、Prisma schema
