# Violet — 空灵浪漫设计系统 (Ethereal Romance)

灵感源自梦幻后期处理的二月兰摄影作品——长春花蓝的弥散光斑、斑驳的阳光、极浅的景深。这不是一个“功能型”的办公软件 UI，而是一场**“悬浮在花海上的”坠入爱河的数字体验**。

## 1. 设计哲学 (Design Philosophy)

- **弥散光斑即背景 (Dappled Light)**: 坚决摒弃死板的纯色背景。背景是缓慢游走的、带有呼吸感的渐变色块，模拟风吹过紫金草花海时，阳光透过树叶落下的斑驳光影。
- **颗粒感即质感 (Film Grain)**: 全局 SVG noise 覆盖层注入胶片和粗糙画布的质感，彻底脱离现代数字产品的“廉价塑料感与AI感”。
- **Z轴景深与悬浮架构 (Floating Depth)**: 抛弃传统 Web 应用“撑满全屏、平铺直叙”的框架。核心交互区像一块巨大的玻璃悬浮在光斑背景之上，四周留白，建立起“前景清晰、背景虚化”的强烈景深感（大光圈效应）。
- **拒绝生硬线条 (Organic Boundaries)**: 恋爱是柔软的。用光晕、半透明渐变（Gradient Borders）和内发光（Inner Shadows）来代替传统的 `1px solid` 分割线。界面元素应当像清晨花瓣上的露珠般晶莹剔透。

## 2. 色彩体系 (Color System)

不仅是颜色的堆砌，更是情绪的划分。

### 核心情绪色板（提取自初春摄影）

| 名称 | 色值 | 情绪/用途 |
|------|------|------|
| **Violet Light** | `#d6e0ff` | **晨曦**：弥散光斑、浅色背景、柔和过渡 |
| **Violet Main** | `#8ca0ff` | **心动**：主交互色、自己的消息气泡、主按钮 |
| **Violet Deep** | `#6b82f0` | **笃定**：Hover 态、品牌核心文字、强调图标 |
| **Spring Green** | `#d4eda4` | **生机/指引**：军师/AI助手模式专属辅助色、匹配徽章 |
| **Cream** | `#fdfdfd` | **画纸**：网页绝对底色（被噪点和光斑覆盖之上） |

### 文字与轮廓色

| 名称 | 色值 | 用途 |
|------|------|------|
| **Ink** | `#3a405a` | 主文字，带有微弱蓝色倾向的深灰，比纯黑更透气 |
| **Ink Muted** | `#7a829a` | 次级文字、输入框占位符、次要图标 |
| **Glass Light**| `rgba(255,255,255,0.7)` | 露珠质感的边框、高光高亮处 |

### 玻璃景深系统 (Glassmorphic Depth)

| 层级名称 | CSS 变量 / 值 | 用途 |
|------|------|------|
| **底层光晕** | `blur(90px)` | 纯背景光斑，极度失焦 |
| **主控台玻璃** | `rgba(255,255,255,0.45)` + `blur(24px)` | 悬浮应用的主体容器 |
| **露珠内阴影** | `inset 0 0 0 1px rgba(255,255,255,0.5)` | 赋予卡片、输入框立体的“玻璃边缘反光” |
| **柔光外阴影** | `0 30px 60px rgba(140,160,255,0.15)` | 让主控台脱离背景，产生漂浮感 |

## 3. 排版系统 (Typography)

诗意与可读性的平衡。

```css
--font-serif: 'Cormorant Garamond', Georgia, serif;   /* 情绪表达、诗意、优雅 */
--font-sans: 'Outfit', -apple-system, sans-serif;       /* 现代感、清晰、青春 */
```

| 角色 | 字体 | 参数 | 备注 |
|------|------|------|------|
| **品牌名 & 大标题** | **Serif** | 300~400，斜体点缀 | 宛如手写情书，用于 "Violet" 和主 Landing Page 标语 |
| **界面模块标题** | **Serif** | 16px - 20px, 500 | 如“主聊天”、“军师私聊”的顶部标题，带入古典美 |
| **正文 (聊天内容)** | **Sans** | 14px, 400, 行高 1.6 | 保证长时间聊天的可读性，清晰无负担 |
| **时间/微型提示** | **Sans** | 11px - 12px, 300 | 极致轻量化，色彩使用 Ink Muted |

## 4. 核心视觉特效 (Signature Visuals)

### 1. 环境光斑 (Ambient Bokeh)
三个大型模糊圆形（blob），通过 CSS `@keyframes` 缓慢浮动且带有轻微缩放（呼吸感）：
- **Blob 1 (Lilac)**: 左上角，高明度。
- **Blob 2 (Violet)**: 右下角，主体色，带位移动画。
- **Blob 3 (Spring Green)**: 游走于中下部，象征透过紫金草射进来的阳光，使用极低透明度。

### 2. 画布颗粒 (Canvas Grain)
通过全屏 SVG Filter 实现 `feTurbulence`（分形噪点）。
`opacity: 0.05`，`pointer-events: none`。这是消除前端代码“生硬感”的终极武器。

### 3. 露珠发光态 (Dewdrop Glow)
重要按钮（如发送消息按钮）和激活态的输入框，不使用死板的 `border` 变色，而是使用同色系的外发光：
`box-shadow: 0 4px 15px rgba(140, 160, 255, 0.3);`

## 5. 组件空间架构规范 (Component Architecture)

### 破冰聊天页 (Icebreaker Chat) 空间布局

抛弃企鹅/飞书式的“左侧导航+右侧聊天”铺满全屏模式。
采用 **悬浮双子星架构**：

1. **悬浮画框 (Main Container)**:
   - 宽度 `92vw`，高度 `90vh`，绝对居中。
   - 带有一圈微弱的白色内发光轮廓，背景为重度毛玻璃。
2. **柔性分割 (Soft Split)**:
   - 左侧主聊天（Violet主调）占据 60%；右侧军师私聊（Green点缀）占据 40%。
   - 两者之间**禁止使用实线边框**。使用 `background: linear-gradient(to right, rgba(255,255,255,0.1), transparent)` 制造光的隔断。
3. **沉浸式输入框 (Dewdrop Input)**:
   - 背景使用较亮的 `rgba(255, 255, 255, 0.7)`。
   - 圆角拉满 `border-radius: 30px`。
   - Focus 状态下，增强白色内阴影，模拟水滴折射光芒。

### 消息气泡规范

| 类型 | 样式定义 |
|------|------|
| **TA 的消息** | `bg: rgba(255,255,255,0.6)` + `border: 1px solid white` + 左下直角，如雾气般轻盈 |
| **我的消息** | `bg: linear-gradient` (Violet Main to Lilac) + 白字 + 右下直角 + 散发紫色光晕 |
| **军师提示框** | `bg: rgba(212,237,164,0.3)` + `border: Spring Green` + 文字色 `#5a7332`，清晰的局外人指引 |

## 6. 动效原则 (Motion & Choreography)

- **出场编排 (Staggered Entrance)**:
  主容器采用 `float-up` 动画（0.8s, ease-out, 从下方 40px 伴随透明度浮现）。容器内元素（消息记录）依次延迟 100ms 浮现，如水波纹般荡漾开。
- **有机缓动曲线 (Organic Easing)**:
  彻底弃用 `linear` 或默认 `ease`。使用 `cubic-bezier(0.2, 0.8, 0.2, 1)`（迅捷启动，极其柔和的刹车），模拟自然风吹草动的物理感。
- **微交互 (Micro-interactions)**:
  按钮 Hover 时除了色彩加深，需伴随非常细微的 `transform: translateY(-2px)` 或 `scale(1.03)`，仿佛它漂浮在水面上被轻轻按下。

---
*Violet Design System. Engineered to feel like a spring breeze.*
