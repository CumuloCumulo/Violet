## Context

当前 `DiscoveryPage.tsx` 是一个传统的垂直网格布局，使用 Framer Motion 做简单动画，4 个 tab（发现/已发起/收到心动/关系）平铺展示用户卡片。设计师提供了一套全新的 `find.html` 原型，采用水平滚动画廊设计，视觉效果显著提升。

新设计使用的技术栈：
- **GSAP 3.12+** + ScrollTrigger：水平滚动驱动、卡片入场、section reveal 动画
- **Lenis**：平滑滚动（替代原生滚动）
- **纯 CSS 变量系统**：`--scale`、`--track-h`、`--dur-*` 等控制响应式和动画参数

现有前端依赖：React 18 + Zustand + Framer Motion（motion/react）。新设计需要引入 GSAP 和 Lenis。

## Goals / Non-Goals

**Goals:**
- 忠实还原 `find.html` 的视觉效果和动画体验
- 将硬编码数据替换为真实 API 调用
- 保留现有业务功能（tab 切换、牵线、接受/拒绝、进入聊天）
- React 组件化，良好的清理和内存管理

**Non-Goals:**
- 不改变后端 API 接口和数据结构
- 不重写其他页面（ChatPage、WingmanHallPage 等）
- 不做服务端渲染或 SEO 优化
- 不替换 Framer Motion（保留给其他页面使用）

## Decisions

### 1. GSAP 集成方式：useGSAP hook + useRef

**选择**: 使用 `@gsap/react` 的 `useGSAP` hook 管理 GSAP 动画生命周期，替代手动 useEffect + cleanup。

**理由**:
- `useGSAP` 自动处理 GSAP context 和 cleanup，避免内存泄漏
- 提供 scope 参数，自动限定动画到组件 DOM 范围内
- 官方推荐的 React 集成方式

**替代方案**:
- 手动 useEffect + `gsap.context()` + cleanup → 可行但代码更冗长
- 继续用 Framer Motion → 无法实现水平滚动驱动动画

### 2. 水平滚动实现：容器固定 + ScrollTrigger scrub

**选择**: 沿用 `find.html` 的方案——容器 `position: fixed`，外层 wapper 设置足够高度，ScrollTrigger 监听垂直滚动来驱动水平位移。

**理由**:
- 这是 GSAP ScrollTrigger 实现水平滚动的标准模式
- 设计师的 `find.html` 已验证可行
- 移动端兼容性好（无需处理水平滚动的 touch 事件差异）

### 3. Lenis 集成

**选择**: 引入 Lenis 平滑滚动库，与 ScrollTrigger 联动。

**理由**:
- `find.html` 原型已使用 Lenis，体验经过验证
- Lenis 提供丝滑的惯性滚动效果
- 与 GSAP ScrollTrigger 的集成文档成熟

### 4. 画廊样式：CSS-in-JS (inline styles) 迁移到 CSS 文件

**选择**: 将 `find.html` 中的 CSS 提取到 `index.css` 或新建 `discovery-gallery.css`，保留 CSS 变量体系。

**理由**:
- 当前 DiscoveryPage 的样式已在 `index.css` 中定义（`.soul-card`、`.aura` 等），保持一致
- 避免大量 inline styles 影响可维护性
- CSS 变量（`--scale`、`--track-h`）需要全局可用

### 5. Tab 内容切换：不同 tab 渲染不同容器

**选择**: "发现" tab 渲染完整的水平画廊（Header→Featured→About→Stats→SoulCards），其他 tab（已发起/收到心动/关系）沿用简化的水平列表或独立视图。

**理由**:
- 设计师的画廊布局专注于"发现"场景
- 已发起/收到心动/关系的内容结构不同，强行套用画廊布局不合理
- 这些 tab 可以使用画廊的视觉语言（背景、卡片样式）但用更简单的布局

### 6. 统计数据（Stats section）

**选择**: Stats section 使用后端已有数据 + 前端近似计算，不新增专用统计 API。

**理由**:
- 当前阶段统计只是装饰性的展示元素
- 活跃用户数可从 `/discovery/users` 的 `total` 字段获取
- "今日心动"、"已成功匹配"等可以暂用 mock 数据，后续再接入真实数据
- 避免为非核心功能增加后端复杂度

## Risks / Trade-offs

**[GSAP 包体积]** → gsap.min.js ~25KB gzip，ScrollTrigger ~12KB gzip，Lenis ~5KB gzip。总计增加 ~42KB gzip。对于课程项目可接受。→ Mitigation: 使用 dynamic import 延迟加载 DiscoveryPage。

**[水平滚动 + 移动端]** → CSS 响应式已有 `@media (max-aspect-ratio: 4/5)` 处理，调整 `--scale`。但在极窄屏幕上水平滚动体验可能不佳。→ Mitigation: 移动端可降级为垂直列表。

**[GSAP 与 React 18 Strict Mode]** → Strict Mode 下 useEffect 会执行两次，可能导致动画初始化问题。→ Mitigation: useGSAP 已处理此问题；必要时可临时禁用 Strict Mode。

**[内存泄漏]** → GSAP 动画和 ScrollTrigger 实例如果不正确清理会导致内存泄漏。→ Mitigation: useGSAP 自动 cleanup，ScrollTrigger 在组件卸载时 kill。

**[tab 切换性能]** → 切换到非"发现" tab 时需要销毁画廊动画实例，切回时重建。→ Mitigation: 使用 React key 触发组件重新挂载。
