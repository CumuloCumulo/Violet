# violet-design-system Specification

## Purpose
Violet 的莫奈印象派设计系统规范。色彩体系源自莫奈画作提取的 5 色和谐色板，整体视觉为温暖明亮的印象派风格。
## Requirements
### Requirement: Violet 色彩体系定义
系统 SHALL 在 DESIGN.md 和 CSS 变量中定义完整的莫奈印象派色彩体系，包含底色、莫奈五色和谐色板、文字色、功能色和消息气泡色。所有色彩 SHALL 使用 CSS 自定义属性定义在 Tailwind `@theme` 块中。

#### Scenario: 色彩变量可被组件引用
- **WHEN** 开发者在 Tailwind 类名中使用 `bg-canvas` 或 `text-ink`
- **THEN** 对应的 CSS 变量值 SHALL 被正确应用，渲染出莫奈印象派色板中定义的颜色

#### Scenario: 底色使用温暖奶油色
- **WHEN** 页面背景需要基础底色
- **THEN** 系统 SHALL 使用 `#faf7f2`（Canvas，温暖奶油色）而非 `#0c0a14`（深紫黑）

#### Scenario: 莫奈五色和谐色板
- **WHEN** 需要交互色彩
- **THEN** 系统 SHALL 提供莫奈蓝 `#6b8fa3`、玫瑰 `#c47d8e`、鼠尾草绿 `#6b8c5a`、金色 `#c4a35a`、薰衣草 `#8e7db5` 五种 accent 色

### Requirement: Typography 规则
系统 SHALL 在 DESIGN.md 中定义 Violet 的排版规则：品牌名使用 weight 300，页面标题使用 weight 500，body 使用 weight 400。字体栈 SHALL 保留系统字体。文字颜色 SHALL 使用深色（墨色）系列。

#### Scenario: 品牌名渲染
- **WHEN** 渲染 "Violet" 品牌名
- **THEN** 使用系统 Display 字体, weight 300, letter-spacing -0.02em, 颜色为 `#2e2a36`（Ink）

### Requirement: 毛玻璃效果规范
系统 SHALL 定义统一的毛玻璃效果样式：`backdrop-filter: blur(24px)` + 暖白半透明底色 `rgba(255, 255, 255, 0.72)`。

#### Scenario: 导航栏毛玻璃
- **WHEN** 聊天页导航栏渲染
- **THEN** 使用暖白半透明底色 + 毛玻璃 backdrop-filter，透过导航栏可看到下方内容的模糊影像，整体呈现温暖的光线穿透感

### Requirement: 微动效规范
系统 SHALL 定义关键交互动效：登录页 stagger 入场、消息气泡 slide-in、模式切换高亮滑动、在线状态 dot pulse。（此需求行为不变，仅视觉色彩跟随新主题变化）

#### Scenario: 登录页入场动效
- **WHEN** 登录页加载完成
- **THEN** 品牌名先 fade-in，副标题 slide-up，表单字段依次 stagger-in，按钮 scale 出现

### Requirement: 消息气泡色彩规范
系统 SHALL 定义消息气泡的颜色规则：自己的消息使用莫奈蓝底 + 白字，对方的消息使用暖奶油底 + 墨色字，系统消息使用薰衣草色胶囊样式，待确认消息使用金色调。

#### Scenario: 自己发送的消息
- **WHEN** 用户发送一条消息
- **THEN** 气泡背景色为 `#6b8fa3`（莫奈蓝），文字色为 `#ffffff`（纯白），右对齐

#### Scenario: 对方发送的消息
- **WHEN** 显示对方发送的消息
- **THEN** 气泡背景色为 `#f0ebe3`（Parchment），文字色为 `#2e2a36`（Ink），左对齐
