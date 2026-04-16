# violet-design-system Specification

## Purpose
TBD - created by archiving change violet-visual-redesign. Update Purpose after archive.
## Requirements
### Requirement: Violet 色彩体系定义
系统 SHALL 在 DESIGN.md 和 CSS 变量中定义完整的 Violet 品牌色彩体系，包含基调色、Accent 色、文字色、功能色和消息气泡色。所有色彩 SHALL 使用 CSS 自定义属性（CSS variables）定义在 `:root` 或 Tailwind `@theme` 块中。

#### Scenario: 色彩变量可被组件引用
- **WHEN** 开发者在 Tailwind 类名中使用 `bg-violet-accent` 或 `text-warm-white`
- **THEN** 对应的 CSS 变量值 SHALL 被正确应用，渲染出设计规范中定义的颜色

#### Scenario: 基调色替换纯黑
- **WHEN** 页面背景需要深色基调
- **THEN** 系统 SHALL 使用 `#0c0a14`（极深紫黑）而非 `#000000`（纯黑）

### Requirement: Typography 规则
系统 SHALL 在 DESIGN.md 中定义 Violet 的排版规则：品牌名使用 weight 300，页面标题使用 weight 500，body 使用 weight 400。字体栈 SHALL 保留 SF Pro 系列。

#### Scenario: 品牌名渲染
- **WHEN** 渲染 "Violet" 品牌名
- **THEN** 使用 SF Pro Display, weight 300, letter-spacing -0.02em

### Requirement: 毛玻璃效果规范
系统 SHALL 定义统一的毛玻璃效果样式：`backdrop-filter: blur(20px) saturate(180%)` + 紫调半透明底色。

#### Scenario: 导航栏毛玻璃
- **WHEN** 聊天页导航栏渲染
- **THEN** 使用紫调半透明底色 + 毛玻璃 backdrop-filter，透过导航栏可看到下方内容的模糊影像

### Requirement: 微动效规范
系统 SHALL 定义关键交互动效：登录页 stagger 入场、消息气泡 slide-in、模式切换高亮滑动、在线状态 dot pulse。

#### Scenario: 登录页入场动效
- **WHEN** 登录页加载完成
- **THEN** 品牌名先 fade-in，副标题 slide-up，表单字段依次 stagger-in，按钮 scale 出现

### Requirement: 消息气泡色彩规范
系统 SHALL 定义消息气泡的颜色规则：自己的消息使用紫罗兰底 + 暖白字，对方的消息使用深紫底 + 浅紫字，系统消息使用紫罗兰色胶囊样式，待确认消息使用琥珀色调。

#### Scenario: 自己发送的消息
- **WHEN** 用户发送一条消息
- **THEN** 气泡背景色为 `#8b5cf6`，文字色为 `#f5f0ff`，右对齐

#### Scenario: 对方发送的消息
- **WHEN** 显示对方发送的消息
- **THEN** 气泡背景色为 `#1f1b2e`，文字色为 `#e0d4f5`，左对齐

