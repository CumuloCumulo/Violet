## MODIFIED Requirements

### Requirement: DEV MODE 登录表单
DEV 模式下的登录界面 SHALL 使用选择式 UI 替代手动输入。用户通过点击卡片选择身份（当事人/军师）、选择具体用户、选择聊天室，然后进入聊天。表单输入框仅在非 DEV 模式下显示。

#### Scenario: DEV 模式选择式 UI
- **WHEN** 应用在开发模式运行
- **THEN** 登录页显示三步选择流程：选身份 → 选用户 → 选聊天室，无手动输入框

#### Scenario: 非 DEV 模式保留输入框
- **WHEN** 应用在生产模式运行
- **THEN** 登录页显示传统的输入框表单（userId、relationshipId 等）

## ADDED Requirements

### Requirement: DEV MODE 徽章保持可见
DEV 模式徽章 SHALL 在新的选择式 UI 中仍然显示，位于品牌名下方。

#### Scenario: 徽章显示
- **WHEN** 选择式登录页渲染
- **THEN** 品牌名下方显示 "DEV MODE" 徽章
