## MODIFIED Requirements

### Requirement: 毛玻璃导航栏
聊天页顶部导航栏 SHALL 使用暖白半透明底色 + `backdrop-filter: blur(24px)` 毛玻璃效果，高度 48px，包含返回按钮、标题、连接状态。

#### Scenario: 导航栏视觉
- **WHEN** 聊天页渲染
- **THEN** 导航栏背景为 `rgba(255, 255, 255, 0.72)` + 毛玻璃 blur，文字为墨色（`#2e2a36`）

#### Scenario: 导航栏文字
- **WHEN** 导航栏内容渲染
- **THEN** 标题为系统字体 15px weight 500，连接状态使用鼠尾草绿圆点 + 次级文字色

### Requirement: 温暖聊天背景
聊天页主区域 SHALL 使用温暖奶油色底色 `#faf7f2`（Canvas），消息区域与此底色一致。

#### Scenario: 聊天区背景
- **WHEN** 用户进入聊天页
- **THEN** 整个聊天区域（消息列表 + 输入区）使用 `#faf7f2` 温暖奶油色背景

### Requirement: 精致的消息气泡
消息气泡 SHALL 使用圆角矩形（20px radius），自己的消息莫奈蓝底 + 白字，对方的消息暖奶油底 + 墨色字。时间戳使用三级文字色。

#### Scenario: 自己的消息气泡
- **WHEN** 显示自己发送的消息
- **THEN** 气泡背景 `#6b8fa3`（莫奈蓝），文字 `#ffffff`（纯白），圆角 20px，右对齐，底部显示时间戳（三级文字色）

#### Scenario: 对方的消息气泡
- **WHEN** 显示对方发送的消息
- **THEN** 气泡背景 `#f0ebe3`（Parchment），文字 `#2e2a36`（Ink），圆角 20px，左对齐，发送者昵称在气泡上方（次级文字色），底部显示时间戳

#### Scenario: 系统消息
- **WHEN** 显示系统消息
- **THEN** 居中显示，使用薰衣草半透明胶囊（`rgba(142, 125, 181, 0.12)` 底 + `#8e7db5` 文字）

#### Scenario: 待确认消息
- **WHEN** 显示待确认消息
- **THEN** 使用金色边框（`rgba(196, 163, 90, 0.4)`）+ 白色底，确认/拒绝按钮使用莫奈蓝/中性色

### Requirement: 精致的输入区域
消息输入区域 SHALL 使用温暖底色，输入框为胶囊形（full radius），莫奈蓝 focus ring，发送按钮为莫奈蓝圆形。

#### Scenario: 输入框默认态
- **WHEN** 输入框未获焦点
- **THEN** 背景为 `#ffffff`（白色），文字为 `#2e2a36`（Ink），placeholder 为 `#9e98aa`（Haze），边框为 `#e4ddd3`

#### Scenario: 输入框焦点态
- **WHEN** 输入框获得焦点
- **THEN** 显示莫奈蓝 focus ring（`rgba(107, 143, 163, 0.3)`），边框变为莫奈蓝调

#### Scenario: 发送按钮
- **WHEN** 有文字时
- **THEN** 发送按钮为莫奈蓝圆形（`#6b8fa3`），hover 变为 `#5a7d91`，无文字时降低透明度

### Requirement: 军师模式切换器
当事人视图中的军师模式切换器 SHALL 使用莫奈蓝色调的 pill 按钮，选中态为莫奈蓝底 + 白字，未选中态为浅色底 + 次级文字色。

#### Scenario: 模式切换视觉
- **WHEN** 当事人看到军师模式选择
- **THEN** 三个 pill 按钮横排，选中的为 `#6b8fa3` 底 + `#ffffff` 字，未选中为 `rgba(107, 143, 163, 0.1)` 底 + `#6e6880` 字

### Requirement: 双面板分隔线
双面板布局的分隔线 SHALL 使用暖色调半透明色（`rgba(46, 42, 54, 0.08)`），而非紫罗兰色。

#### Scenario: 面板分隔
- **WHEN** 主聊天和私聊面板并排显示
- **THEN** 中间分隔线为 `rgba(46, 42, 54, 0.08)`，宽度 1px

### Requirement: 面板头部
每个聊天面板的头部 SHALL 使用温暖底色 + 墨色标题，底部分隔线使用柔和暖色。

#### Scenario: 面板头部视觉
- **WHEN** 聊天面板渲染
- **THEN** 头部背景为 `#f5f0ea`（浅暖色），标题为 `#2e2a36`（Ink），底部分隔线为 `rgba(46, 42, 54, 0.08)`

### Requirement: 在线状态指示器
PresenceIndicator SHALL 使用浅色背景的圆形头像 + 鼠尾草绿在线点。

#### Scenario: 在线成员显示
- **WHEN** 房间内有在线成员
- **THEN** 显示圆形头像（`#f0ebe3` 底 + `#6b8fa3` 文字首字母），右下角鼠尾草绿圆点表示在线，旁边显示"N人在线"（次级文字色）

### Requirement: 消息入场动效
新消息 SHALL 有 slide-in + fade-in 入场动画。（行为不变）

#### Scenario: 收到新消息
- **WHEN** 一条新消息到达
- **THEN** 消息气泡从底部 slide-in（translateY 10px → 0）+ fade-in（opacity 0 → 1），duration 300ms
