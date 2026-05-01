## 1. 依赖安装与准备

- [x] 1.1 安装 gsap（含 ScrollTrigger）和 lenis 依赖：`pnpm add gsap lenis`（在 client 目录）
- [x] 1.2 验证 gsap 和 lenis 的 TypeScript 类型支持，必要时安装 @types 或创建声明文件

## 2. 样式迁移

- [x] 2.1 将 find.html 中的 CSS（ambient bokeh、noise overlay、track lines、playhead、gallery、nav-bar、soul-card、responsive 等）提取到 `client/src/discovery-gallery.css` 中，替换旧的 `.soul-card`、`.aura` 等样式
- [x] 2.2 保留或新增 CSS 变量体系（`--scale`、`--track-h`、`--dur-*`、`--ease-*`、`--violet-*` 等），确保与现有 Violet 设计系统兼容

## 3. 画廊核心组件

- [x] 3.1 创建 `DiscoveryGallery` 子组件：实现水平滚动容器（container fixed + wapper 高度 + ScrollTrigger scrub），接收用户列表数据作为 props
- [x] 3.2 实现 Lenis 平滑滚动初始化，与 ScrollTrigger 联动（gsap.ticker.add）
- [x] 3.3 实现 ScrollTrigger 驱动的水平位移：监听垂直滚动，`gsap.set(container, { x: -progress * maxX })`
- [x] 3.4 实现视差装饰层（container-clips）：0.1x 速度跟随
- [x] 3.5 实现自定义滚动条：右侧 thumb 随滚动进度移动，hover 半透明效果
- [x] 3.6 实现 resize 处理：重置 reveal 状态、kill 旧 ScrollTrigger、重新 setup

## 4. Section 组件实现

- [x] 4.1 实现 SecHeader 组件：eyebrow（Violet · Discovery）、标题（Soul Gallery）、描述文字、装饰 blocks，入场动画逐行展开
- [x] 4.2 实现 SecFeatured 组件：竖排 tip 标签、大面积 aura 卡片（渐变背景 + glassmorphism）、quote 和 author，滚动入场动画
- [x] 4.3 实现 SecAbout 组件：镂空描边大字（About）、介绍文字、脉冲装饰 blocks
- [x] 4.4 实现 SecStats 组件：统计标题（Campus Pulse）、5 行数据（活跃灵魂/今日心动/已成功匹配/覆盖校区/平均破冰时长），带进度条动画；活跃灵魂数从 API total 获取
- [x] 4.5 实现 SecSoulsTitle 组件：心形 SVG + "Soul Cards" + "滑动探索每一个灵魂" 标题

## 5. Soul Card 组件

- [x] 5.1 创建 SoulCard 组件：接收 DiscoverUser 数据，渲染 aura 渐变（性别关联配色）、性别图标、校区年级、恋爱宣言、兴趣标签、旋转十字装饰
- [x] 5.2 实现 SoulCard 入场动画（revealCard）：aura clip-path 展开 → meta 文字滑入 → quote 逐行显示 → cross 旋转缩放 → tags 滑入
- [x] 5.3 实现 SoulCard "牵线"交互：点击触发确认弹窗，确认后调用 `/discovery/match-request` API

## 6. 导航栏与 Tab 系统

- [x] 6.1 重写 DiscoveryPage 的固定导航栏：Violet logo + tabs + 信用分 + 军师大厅/管理/个人中心/退出按钮，glassmorphism 风格
- [x] 6.2 实现 tab 切换逻辑：发现 tab 渲染 DiscoveryGallery，其他 tab 渲染简化列表（保留画廊视觉风格）
- [x] 6.3 实现"已发起" tab 内容：调用 `/discovery/match-requests/sent`，渲染带状态标签的 SoulCard 列表
- [x] 6.4 实现"收到心动" tab 内容：调用 `/discovery/match-requests/received`，渲染带接受/拒绝按钮的卡片，tab 上显示红点徽章
- [x] 6.5 实现"关系" tab 内容：调用 `/discovery/relationships`，渲染当事人/军师两种视角的 RelationshipCard，带"进入聊天"按钮

## 7. 环境氛围与全局效果

- [x] 7.1 实现 AmbientBg 组件：三个 bokeh blob（violet-light、violet-main、spring-green）CSS 动画漂移
- [x] 7.2 实现 NoiseOverlay 组件：SVG feTurbulence 全屏覆盖，opacity 0.04
- [x] 7.3 实现 Track Lines + Playhead 装饰元素：track lines 水平渐变线 + 居中垂直指示线

## 8. 入场动画编排

- [x] 8.1 实现 entranceAnimation 编排：nav bar 滑入 → track lines 展开 → playhead 展开 → header 文字逐行入场 → header blocks 渐显 → clip decorations 滑入 → scrollbar 显示 → featured section 入场（如果在视口内）
- [x] 8.2 实现 sectionReveal 系统：当画廊水平滚动到各 section 位置时，触发该 section 的入场动画（featured、about、stats、souls title）

## 9. 确认弹窗与交互

- [x] 9.1 重写确认弹窗（ConfirmModal）：glassmorphism 风格，"确认向 TA 发起牵线？消耗 5 信用分"，取消/确认按钮
- [x] 9.2 实现接受请求流程：调用 accept API → connect socket → joinRoom → enterChat
- [x] 9.3 实现拒绝请求流程：调用 reject API → 刷新 received 列表

## 10. 清理与验证

- [x] 10.1 移除 DiscoveryPage 中旧的网格布局代码和旧版 SoulCard/MysteryCard/AuraCircle 组件
- [x] 10.2 确保 GSAP/Lenis 所有实例在组件卸载时正确清理（useGSAP context cleanup）
- [x] 10.3 测试 4 个 tab 切换流畅性，确保 tab 切回"发现"时画廊正确重新初始化
- [x] 10.4 测试移动端响应式：窄屏下 --scale 调整、导航栏按钮隐藏、卡片尺寸适配
