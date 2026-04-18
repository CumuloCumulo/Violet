## 1. 设计系统与 CSS 基础

- [x] 1.1 重写 DESIGN.md — 完全替换为莫奈印象派设计系统文档，包含色彩体系、Typography、毛玻璃效果、消息气泡规范
- [x] 1.2 更新 index.css — 替换所有 CSS 变量为莫奈色板（Canvas、Parchment、Lily White、莫奈蓝、玫瑰、鼠尾草绿、金色、薰衣草、Ink、Shadow、Haze），更新毛玻璃效果为暖白调，更新滚动条颜色，更新登录渐变

## 2. 登录页重设计

- [x] 2.1 更新 App.tsx 背景渐变 — 从深紫聚光灯（#0c0a14 → #1a1028）改为温暖金光渐变（#f5efe4 → #faf7f2）
- [x] 2.2 更新 App.tsx 表单输入框 — 白色背景、暖灰边框、莫奈蓝 focus ring、墨色文字
- [x] 2.3 更新 App.tsx 品牌区和按钮 — 品牌名用墨色，副标题用次级文字色，CTA 按钮用莫奈蓝，DEV MODE 徽章用薰衣草色

## 3. 聊天页框架重设计

- [x] 3.1 更新 ChatPage.tsx 导航栏 — 暖白半透明毛玻璃底色 + 墨色文字 + 鼠尾草绿连接状态
- [x] 3.2 更新 ChatPage.tsx 模式切换器和面板分隔 — 莫奈蓝 pill 按钮、暖色分隔线、Canvas 底色

## 4. 消息面板重设计

- [x] 4.1 更新 ChatPanel.tsx 面板背景和头部 — Canvas 底色、浅暖色头部背景、暖色分隔线
- [x] 4.2 更新 ChatPanel.tsx 消息气泡 — 自己消息莫奈蓝底+白字，对方消息暖奶油底+墨色字，系统消息薰衣草胶囊，待确认消息金色边框
- [x] 4.3 更新 ChatPanel.tsx 时间戳和加载状态 — 三级文字色

## 5. 输入与在线组件重设计

- [x] 5.1 更新 MessageInput.tsx — 白色输入框、暖灰边框、莫奈蓝 focus ring 和发送按钮、浅色颜文字选择器
- [x] 5.2 更新 PresenceIndicator.tsx — 浅色头像底色、鼠尾草绿在线指示点、次级文字色
