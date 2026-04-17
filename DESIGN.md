# Violet — 空灵浪漫设计系统 (Ethereal Romance)

灵感源自梦幻后期处理的二月兰摄影作品——长春花蓝的弥散光斑、斑驳的阳光、极浅的景深。这不是一个"功能型"的 UI，而是一场坠入爱河的数字体验。

## 1. 设计哲学

- **弥散光斑即背景**: 不用纯色填充。背景是缓慢游走的渐变色块，模拟风吹过紫色花海
- **毛玻璃即景深**: 所有卡片和面板都像漂浮在花海上的毛玻璃，呼应大光圈的虚化效果
- **颗粒感即质感**: 全局 SVG noise 覆盖层注入胶片/画布的微粗糙感，脱离数字产品的"塑料感"

## 2. 色彩体系

### 核心色板（从二月兰摄影中提取）

| 名称 | 色值 | 用途 |
|------|------|------|
| Violet Light | `#d6e0ff` | 弥散光斑、浅色背景区域 |
| Violet Main | `#8ca0ff` | 主交互色：CTA、自己消息气泡、选中态 |
| Violet Deep | `#6b82f0` | Hover 态、强调 |
| Spring Green | `#d4eda4` | 辅助色：徽章、点缀（少量使用） |
| Cream | `#fbfbfc` | 页面底色 |

### 文字色

| 名称 | 色值 | 用途 |
|------|------|------|
| Ink | `#3a405a` | 主文字 |
| Ink Light | `#5a627a` | 次级文字 |
| Ink Muted | `#7a829a` | 三级文字、标签 |

### 毛玻璃系统

| 名称 | 值 | 用途 |
|------|------|------|
| Glass BG | `rgba(255, 255, 255, 0.18)` | 卡片、面板背景 |
| Glass Border | `rgba(255, 255, 255, 0.35)` | 毛玻璃边框 |
| Glass Heavy BG | `rgba(255, 255, 255, 0.55)` | 消息气泡（对方）、更实的表面 |
| Blur Heavy | `blur(24px)` | 导航栏、卡片 |
| Blur Light | `blur(12px)` | 消息气泡、输入区域 |

### 消息气泡色

| 类型 | 背景 | 文字 |
|------|------|------|
| 自己的消息 | `#8ca0ff` + `box-shadow: 0 4px 16px rgba(140, 160, 255, 0.25)` | `#ffffff` |
| 对方的消息 | `rgba(255, 255, 255, 0.55)` + `backdrop-filter: blur(12px)` | `#3a405a` |
| 系统消息 | `rgba(140, 160, 255, 0.12)` | `#6b82f0` |
| 待确认消息 | `rgba(255, 255, 255, 0.55)` + 金色边框 | `#3a405a` |

## 3. Typography

### 字体

```css
--font-serif: 'Cormorant Garamond', Georgia, serif;   /* 标题、品牌名 */
--font-sans: 'Outfit', -apple-system, sans-serif;       /* 正文、UI */
```

### 排版层级

| 角色 | 字体 | 字号 | 字重 | 备注 |
|------|------|------|------|------|
| 品牌名 "Violet" | Serif | 56px | 300 | letter-spacing: 0.02em |
| 页面标题 | Serif | 15px | 500 | 聊天页导航标题 |
| 正文 | Sans | 14px | 400 | 消息文字 |
| 标签 | Sans | 12px | 400 | 输入框标签 |
| 时间戳 | Sans | 10px | 400 | 消息时间 |

## 4. 视觉特效

### 弥散光斑背景

三个大型模糊圆形（blob），通过 CSS `@keyframes` 缓慢浮动：
- Blob 1: Violet Light (#d6e0ff)，左上角
- Blob 2: Violet Main (#8ca0ff)，右下角，较低透明度
- Blob 3: Spring Green (#d4eda4)，中间偏右，最低透明度

```css
.blob { border-radius: 50%; filter: blur(80px); animation: 20s infinite alternate; }
```

### 噪点覆盖层

全局 SVG feTurbulence noise，opacity 0.06，pointer-events: none。避免渐变的"塑料感"。

### 按钮光晕

主 CTA 按钮使用 `box-shadow: 0 8px 24px rgba(140, 160, 255, 0.35)` 创造发光感。

## 5. 组件规范

### 登录页

- 背景：弥散光斑 + 噪点
- 表单：毛玻璃卡片（glass 类），圆角 28px
- 输入框：`rgba(255, 255, 255, 0.5)` 底色，Violet 边框和 focus ring
- 按钮：Violet Main 底色 + 光晕阴影

### 聊天页导航栏

- 背景：`rgba(251, 251, 252, 0.5)` + `backdrop-filter: blur(20px)`
- 标题：Cormorant Garamond serif 字体
- 在线状态：鼠尾草绿圆点

### 消息输入区

- 输入框：半透明白底 + blur + Violet 边框
- 发送按钮：Violet Main 圆形 + 光晕阴影
- 颜文字选择器：毛玻璃面板

### 在线指示器

- 头像底色：`rgba(140, 160, 255, 0.12)`
- 首字母：Violet Deep (#6b82f0)
- 在线点：`#6b8c5a`（深绿，与 Spring Green 区分）

## 6. 动效原则

- **缓动曲线**: `cubic-bezier(0.2, 0.8, 0.2, 1)` — 如微风拂过，非线性
- **Stagger 入场**: 品牌名 → 副标题 → 表单 → 按钮，每项间隔 200-300ms
- **消息入场**: `translateY(10px) → 0` + `opacity 0 → 1`，duration 300ms
- **背景**: 持续缓慢浮动，20s 周期
