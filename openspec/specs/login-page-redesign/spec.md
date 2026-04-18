# login-page-redesign Specification

## Purpose
TBD - created by archiving change violet-visual-redesign. Update Purpose after archive.
## Requirements
### Requirement: 品牌展示区域
登录页 SHALL 在页面顶部居中展示 "Violet" 品牌名和副标题 "对话即心跳 — 校园恋爱代聊平台"。品牌名使用大号字体（至少 48px），副标题使用较小字号和半透明文字色。

#### Scenario: 品牌名视觉呈现
- **WHEN** 用户打开登录页
- **THEN** "Violet" 以 SF Pro Display weight 300、至少 48px、暖白色（`#f5f0ff`）居中显示

#### Scenario: 副标题呈现
- **WHEN** 品牌名下方
- **THEN** 显示 "对话即心跳 — 校园恋爱代聊平台"，使用半透明暖白色，比品牌名字号小至少 2 级

### Requirement: 全屏深紫渐变背景
登录页 SHALL 使用全屏深紫渐变背景（`#0c0a14` → `#1a1028` → `#0c0a14`），覆盖整个视口。

#### Scenario: 背景渲染
- **WHEN** 登录页加载
- **THEN** 整个视口被深紫渐变覆盖，中心略亮、边缘更暗，营造聚光灯效果

### Requirement: DEV MODE 登录表单
DEV 模式下的登录界面 SHALL 使用选择式 UI 替代手动输入。用户通过点击卡片选择身份（当事人/军师）、选择具体用户、选择聊天室，然后进入聊天。表单输入框仅在非 DEV 模式下显示。

#### Scenario: DEV 模式选择式 UI
- **WHEN** 应用在开发模式运行
- **THEN** 登录页显示三步选择流程：选身份 → 选用户 → 选聊天室，无手动输入框

#### Scenario: 非 DEV 模式保留输入框
- **WHEN** 应用在生产模式运行
- **THEN** 登录页显示传统的输入框表单（userId、relationshipId 等）

### Requirement: 精致的表单输入框
每个输入框 SHALL 使用半透明紫调背景、紫罗兰 focus ring、暖白色文字，placeholder 使用低透明度暖白。

#### Scenario: 输入框默认态
- **WHEN** 输入框未获得焦点
- **THEN** 背景色为 `#1a1525`，边框为 `rgba(139, 92, 246, 0.15)`，文字为 `#f5f0ff`

#### Scenario: 输入框焦点态
- **WHEN** 输入框获得焦点
- **THEN** 边框变为紫罗兰色 ring（`#8b5cf6`，opacity 0.5），有平滑过渡动画

### Requirement: 主 CTA 按钮
"进入聊天" 按钮 SHALL 使用紫罗兰背景、暖白文字，disabled 态下降低透明度。

#### Scenario: 按钮默认态
- **WHEN** 表单填写完整
- **THEN** 按钮背景为 `#8b5cf6`，文字为 `#f5f0ff`，hover 时背景变为 `#7c3aed`

#### Scenario: 按钮 disabled 态
- **WHEN** 必填字段为空
- **THEN** 按钮显示为半透明（opacity 0.3），不可点击

### Requirement: 入场动效
登录页加载时 SHALL 播放 stagger 入场动画：品牌名 fade-in → 副标题 slide-up → 表单字段依次出现 → 按钮 scale。

#### Scenario: 动画编排
- **WHEN** 页面首次渲染
- **THEN** 品牌名在 0ms fade-in（duration 600ms），副标题在 200ms slide-up（duration 500ms），表单在 400ms 起 stagger-in（每项间隔 100ms），按钮在 800ms scale-in

### Requirement: DEV MODE 徽章
开发模式下 SHALL 显示 "DEV MODE" 徽章，使用紫罗兰色调而非 Apple Blue。徽章 SHALL 在新的选择式 UI 中仍然显示，位于品牌名下方。

#### Scenario: DEV MODE 显示
- **WHEN** 应用在开发模式运行
- **THEN** 表单下方显示 "DEV MODE" 徽章，背景为 `rgba(139, 92, 246, 0.15)`，文字为 `#a78bfa`

#### Scenario: 徽章在选择式 UI 中保持可见
- **WHEN** 选择式登录页渲染
- **THEN** 品牌名下方显示 "DEV MODE" 徽章

