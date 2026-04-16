# chat-page-redesign Specification

## Purpose
TBD - created by archiving change violet-visual-redesign. Update Purpose after archive.
## Requirements
### Requirement: 毛玻璃导航栏
聊天页顶部导航栏 SHALL 使用紫调半透明底色 + `backdrop-filter: blur(20px) saturate(180%)` 毛玻璃效果，高度 48px，包含返回按钮、标题、连接状态。

#### Scenario: 导航栏视觉
- **WHEN** 聊天页渲染
- **THEN** 导航栏背景为 `rgba(12, 10, 20, 0.8)` + 毛玻璃 blur，文字为暖白色

#### Scenario: 导航栏文字
- **WHEN** 导航栏内容渲染
- **THEN** 标题为 SF Pro Text 15px weight 500，连接状态使用翡翠绿圆点 + 半透明文字

### Requirement: 深色聊天背景
聊天页主区域 SHALL 使用深紫黑底色 `#0c0a14`，消息区域与此底色一致。

#### Scenario: 聊天区背景
- **WHEN** 用户进入聊天页
- **THEN** 整个聊天区域（消息列表 + 输入区）使用 `#0c0a14` 深紫黑背景

### Requirement: 精致的消息气泡
消息气泡 SHALL 使用圆角矩形（20px radius），自己的消息紫罗兰底 + 暖白字，对方的消息深紫底 + 浅紫字。时间戳使用低透明度文字。

#### Scenario: 自己的消息气泡
- **WHEN** 显示自己发送的消息
- **THEN** 气泡背景 `#8b5cf6`，文字 `#f5f0ff`，圆角 20px，右对齐，底部显示时间戳（半透明）

#### Scenario: 对方的消息气泡
- **WHEN** 显示对方发送的消息
- **THEN** 气泡背景 `#1f1b2e`，文字 `#e0d4f5`，圆角 20px，左对齐，发送者昵称在气泡上方（半透明），底部显示时间戳

#### Scenario: 系统消息
- **WHEN** 显示系统消息
- **THEN** 居中显示，使用紫罗兰半透明胶囊（`rgba(139, 92, 246, 0.15)` 底 + `#a78bfa` 文字）

#### Scenario: 待确认消息
- **WHEN** 显示待确认消息
- **THEN** 使用琥珀色边框（`rgba(251, 191, 36, 0.3)`）+ 深色底，确认/拒绝按钮使用紫罗兰/中性色

### Requirement: 精致的输入区域
消息输入区域 SHALL 使用深色底，输入框为胶囊形（full radius），紫罗兰 focus ring，发送按钮为紫罗兰圆形。

#### Scenario: 输入框默认态
- **WHEN** 输入框未获焦点
- **THEN** 背景为 `#1a1525`，文字为 `#f5f0ff`，placeholder 为 `rgba(245, 240, 255, 0.3)`

#### Scenario: 输入框焦点态
- **WHEN** 输入框获得焦点
- **THEN** 显示紫罗兰色 focus ring（`rgba(139, 92, 246, 0.4)`）

#### Scenario: 发送按钮
- **WHEN** 有文字时
- **THEN** 发送按钮为紫罗兰圆形（`#8b5cf6`），无文字时半透明

### Requirement: 军师模式切换器
当事人视图中的军师模式切换器 SHALL 使用紫罗兰色调的 pill 按钮，选中态为紫罗兰底 + 暖白字，未选中态为半透明底 + 半透明字。

#### Scenario: 模式切换视觉
- **WHEN** 当事人看到军师模式选择
- **THEN** 三个 pill 按钮横排，选中的为 `#8b5cf6` 底 + `#f5f0ff` 字，未选中为 `rgba(139, 92, 246, 0.1)` 底 + `rgba(245, 240, 255, 0.5)` 字

### Requirement: 双面板分隔线
双面板布局的分隔线 SHALL 使用紫罗兰半透明色（`rgba(139, 92, 246, 0.15)`），而非灰色。

#### Scenario: 面板分隔
- **WHEN** 主聊天和私聊面板并排显示
- **THEN** 中间分隔线为 `rgba(139, 92, 246, 0.15)`，宽度 1px

### Requirement: 面板头部
每个聊天面板的头部 SHALL 使用深色底 + 暖白标题，不使用白色背景和灰色边框。

#### Scenario: 面板头部视觉
- **WHEN** 聊天面板渲染
- **THEN** 头部背景为 `#0f0d17`，标题为 `#f5f0ff`，底部分隔线为 `rgba(139, 92, 246, 0.1)`

### Requirement: 在线状态指示器
PresenceIndicator SHALL 使用深色背景的圆形头像 + 翡翠绿在线点。

#### Scenario: 在线成员显示
- **WHEN** 房间内有在线成员
- **THEN** 显示圆形头像（`#1a1525` 底 + `#a78bfa` 文字首字母），右下角翡翠绿圆点表示在线，旁边显示"N人在线"（半透明文字）

### Requirement: 消息入场动效
新消息 SHALL 有 slide-in + fade-in 入场动画。

#### Scenario: 收到新消息
- **WHEN** 一条新消息到达
- **THEN** 消息气泡从底部 slide-in（translateY 10px → 0）+ fade-in（opacity 0 → 1），duration 300ms

