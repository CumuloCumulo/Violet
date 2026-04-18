## MODIFIED Requirements

### Requirement: 品牌展示区域
登录页 SHALL 在页面顶部居中展示 "Violet" 品牌名和副标题 "对话即心跳 — 校园恋爱代聊平台"。品牌名使用大号字体（至少 48px），副标题使用较小字号和次级文字色。

#### Scenario: 品牌名视觉呈现
- **WHEN** 用户打开登录页
- **THEN** "Violet" 以系统 Display 字体 weight 300、至少 48px、墨色（`#2e2a36`）居中显示

#### Scenario: 副标题呈现
- **WHEN** 品牌名下方
- **THEN** 显示 "对话即心跳 — 校园恋爱代聊平台"，使用次级文字色（`#6e6880`），比品牌名字号小至少 2 级

### Requirement: 温暖金光渐变背景
登录页 SHALL 使用全屏温暖金光渐变背景，从中心的暖金色（`#f5efe4`）向边缘的奶油色（`#faf7f2`）辐射，覆盖整个视口。

#### Scenario: 背景渲染
- **WHEN** 登录页加载
- **THEN** 整个视口被温暖金光渐变覆盖，中心略暖、边缘为奶油色，营造阳光穿透花园的印象派氛围

### Requirement: 精致的表单输入框
每个输入框 SHALL 使用白色背景、温暖边框、莫奈蓝 focus ring、墨色文字，placeholder 使用三级文字色。

#### Scenario: 输入框默认态
- **WHEN** 输入框未获得焦点
- **THEN** 背景色为 `#ffffff`（白色），边框为 `#e4ddd3`（暖灰），文字为 `#2e2a36`（Ink），placeholder 为 `#9e98aa`（Haze）

#### Scenario: 输入框焦点态
- **WHEN** 输入框获得焦点
- **THEN** 边框变为莫奈蓝 ring（`rgba(107, 143, 163, 0.3)`），有平滑过渡动画

### Requirement: 主 CTA 按钮
"进入聊天" 按钮 SHALL 使用莫奈蓝背景、白色文字，disabled 态下降低透明度。

#### Scenario: 按钮默认态
- **WHEN** 表单填写完整
- **THEN** 按钮背景为 `#6b8fa3`（莫奈蓝），文字为 `#ffffff`，hover 时背景变为 `#5a7d91`

#### Scenario: 按钮 disabled 态
- **WHEN** 必填字段为空
- **THEN** 按钮显示为半透明（opacity 0.3），不可点击

### Requirement: 入场动效
登录页加载时 SHALL 播放 stagger 入场动画：品牌名 fade-in → 副标题 slide-up → 表单字段依次出现 → 按钮 scale。（行为不变，色彩跟随新主题）

#### Scenario: 动画编排
- **WHEN** 页面首次渲染
- **THEN** 品牌名在 0ms fade-in（duration 600ms），副标题在 200ms slide-up（duration 500ms），表单在 400ms 起 stagger-in（每项间隔 100ms），按钮在 800ms scale-in

### Requirement: DEV MODE 徽章
开发模式下 SHALL 显示 "DEV MODE" 徽章，使用薰衣草色调。

#### Scenario: DEV MODE 显示
- **WHEN** 应用在开发模式运行
- **THEN** 表单下方显示 "DEV MODE" 徽章，背景为 `rgba(142, 125, 181, 0.12)`，文字为 `#8e7db5`（薰衣草）
