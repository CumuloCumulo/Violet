## Why

当前发现页（DiscoveryPage）使用传统的垂直网格卡片布局，UI 平淡，缺乏品牌辨识度和沉浸感。设计师已完成一套全新的水平滚动画廊设计方案（`find.html`），包含 GSAP 动画、Lenis 平滑滚动、多 section 叙事流程（Header → Featured → About → Stats → Soul Cards），需要将其集成到 React 项目中替换现有发现页。

## What Changes

- **全面重写 DiscoveryPage**：从垂直网格布局改为水平滚动画廊，复用 `find.html` 的视觉设计和动画体系
- **集成 GSAP + ScrollTrigger + Lenis**：新增前端动画依赖，实现水平滚动、卡片入场、section reveal 等动画效果
- **数据动态化**：将 `find.html` 中的硬编码 mock 数据替换为真实 API 数据（用户列表、统计数据等）
- **保留现有业务逻辑**：tab 切换（发现/已发起/收到心动/关系）、牵线请求、接受/拒绝等交互功能不变，在新 UI 框架下重新实现
- **固定导航栏**：nav bar 从页面内 header 改为固定在顶部的 glassmorphism 风格导航，包含 logo、tabs、操作按钮
- **新增 section**：Featured（精选灵魂）、About（平台介绍）、Stats（校园数据）三个展示性 section
- **自定义滚动条**：右侧自定义滚动指示器替代浏览器原生滚动条
- **环境氛围层**：ambient bokeh 背景 + noise overlay

## Capabilities

### New Capabilities
- `discovery-gallery`: 水平滚动画廊式发现页——GSAP 动画驱动、Lenis 平滑滚动、多 section 叙事布局、自定义滚动条、真实 API 数据绑定

### Modified Capabilities
（无现有 spec 需要修改）

## Impact

- **前端**: `client/src/pages/DiscoveryPage.tsx` 全面重写；`client/src/index.css` 新增画廊相关样式
- **新增依赖**: `gsap`（含 ScrollTrigger 插件）、`lenis`（平滑滚动库）
- **后端 API**: 可能需要新增统计接口（活跃用户数、今日心动数等），现有 `/discovery/users` 等接口不变
- **构建**: 需确认 GSAP 和 Lenis 的打包体积对首屏加载的影响
