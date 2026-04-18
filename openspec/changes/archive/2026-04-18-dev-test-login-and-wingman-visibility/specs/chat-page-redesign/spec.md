## ADDED Requirements

### Requirement: 军师主聊天窗口动态可见性
军师端的主聊天窗口 SHALL 根据当前军师模式动态显示或隐藏：PRIVATE 模式隐藏主窗口，ASSIST 和 SOLO 模式显示主窗口。军师私聊窗口始终可见。

#### Scenario: 军师 PRIVATE 模式
- **WHEN** 军师的介入模式为 PRIVATE
- **THEN** 军师仅显示与当事人的私聊窗口，主聊天窗口（当事人间对话）不可见

#### Scenario: 军师 ASSIST 模式
- **WHEN** 当事人将军师切换为 ASSIST 模式
- **THEN** 军师端同时显示私聊窗口和主聊天窗口，主窗口可查看当事人对话并草拟消息

#### Scenario: 军师 SOLO 模式
- **WHEN** 当事人将军师切换为 SOLO 模式
- **THEN** 军师端同时显示私聊窗口和主聊天窗口，军师可直接在主窗口代发消息

#### Scenario: 模式实时切换
- **WHEN** 当事人切换军师模式后
- **THEN** 军师端 UI 在收到 `modeSwitched` socket 事件后立即更新，无需刷新页面

### Requirement: 模式切换状态 store 同步
`modeSwitched` socket 事件 SHALL 更新 chatStore 中对应聊天室的 wingmanMode 状态，ChatPage 从 store 读取模式而非 prop。

#### Scenario: 当事人切换模式
- **WHEN** 当事人 emit `switchMode` 并收到 `modeSwitched` 回调
- **THEN** store 中该聊天室的对应 wingmanMode 更新为新模式，UI 模式切换器高亮更新

#### Scenario: 军师收到模式变更
- **WHEN** 军师收到 `modeSwitched` socket 事件
- **THEN** store 中该聊天室的 wingmanMode 更新，`showMainPanel` 根据新模式重新计算

### Requirement: 多军师模式独立管理
当聊天室存在两个军师时，每个军师的模式 SHALL 独立存储和管理，互不影响。

#### Scenario: 两个军师不同模式
- **WHEN** 军师 A 为 PRIVATE 模式，军师 B 为 ASSIST 模式
- **THEN** 军师 A 看不到主聊天窗口，军师 B 可以看到主聊天窗口
