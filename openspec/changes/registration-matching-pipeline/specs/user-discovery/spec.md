## ADDED Requirements

### Requirement: 用户卡片列表浏览
系统 SHALL 提供活跃用户（7 天内登录过）的分页列表，按 `lastActiveAt` 降序排列。每张用户卡片 SHALL 展示：性别、校区、兴趣标签、恋爱宣言和活跃状态。头像和昵称 SHALL NOT 展示——发现阶段保持匿名。

#### Scenario: 浏览首页列表
- **WHEN** 已认证用户请求用户列表（无分页参数）
- **THEN** 系统返回按最后活跃时间降序排列的前 20 个活跃用户，每个包含性别、校区、兴趣标签、恋爱宣言和活跃状态，不含昵称和头像

#### Scenario: 分页浏览
- **WHEN** 用户请求第 2 页（每页 20 条）
- **THEN** 系统返回第 21-40 条用户数据

#### Scenario: 无活跃用户
- **WHEN** 近 7 天内无用户登录
- **THEN** 系统返回空列表

### Requirement: 列表中排除自己
系统 SHALL 将请求者本人从用户列表结果中排除。用户 SHALL NOT 在发现列表中看到自己的卡片。

#### Scenario: 浏览列表不含自己
- **WHEN** 用户 A 请求用户列表
- **THEN** 结果中不包含用户 A 的卡片

### Requirement: 发起牵线请求
系统 SHALL 允许用户向其他用户发送牵线请求。发送牵线请求 SHALL 消耗发送方的信用分。用户可同时向多个不同用户发起牵线。

#### Scenario: 牵线请求发送成功
- **WHEN** 用户 A（信用分充足）向用户 B 发起牵线请求
- **THEN** 系统创建一条 MatchRequest 记录（状态为 `PENDING`），扣除用户 A 的信用分，返回请求 ID

#### Scenario: 信用分不足
- **WHEN** 用户 A 的信用分少于牵线所需费用
- **THEN** 系统返回 403 错误，提示信用分不足

#### Scenario: 防止重复请求
- **WHEN** 用户 A 向用户 B 发起牵线，但已存在一条 A→B 的 PENDING 请求
- **THEN** 系统返回 409 冲突错误

### Requirement: 响应牵线请求
系统 SHALL 允许目标用户接受或拒绝待处理的牵线请求。接受后，系统 SHALL 创建一条状态为 `ICEBREAKING` 的 Relationship 记录并通知双方。拒绝后，牵线请求被关闭。

#### Scenario: 接受牵线请求
- **WHEN** 用户 B 接受来自用户 A 的待处理牵线请求
- **THEN** 系统创建 A 和 B 之间的 Relationship（状态 `ICEBREAKING`），将 MatchRequest 状态更新为 `ACCEPTED`，返回关系 ID

#### Scenario: 拒绝牵线请求
- **WHEN** 用户 B 拒绝来自用户 A 的牵线请求
- **THEN** 系统将 MatchRequest 状态更新为 `REJECTED`，不创建 Relationship

#### Scenario: 非目标用户无法响应
- **WHEN** 用户 C（非目标用户）尝试响应 A→B 的牵线请求
- **THEN** 系统返回 403 禁止错误

### Requirement: 牵线请求超时机制
系统 SHALL 自动将 24 小时内未响应的牵线请求标记为 `EXPIRED`。过期请求仅通知发起方，不打扰被请求方。

#### Scenario: 请求 24 小时后过期
- **WHEN** 一条牵线请求已 PENDING 超过 24 小时
- **THEN** 系统将其标记为 `EXPIRED`，该请求不再出现在被请求方的待处理列表中

#### Scenario: 过期请求不出现在待处理列表
- **WHEN** 用户 B 查看收到的牵线请求
- **THEN** 列表中仅包含 PENDING（未过期）的请求

### Requirement: 查看已发送和已收到的牵线请求
系统 SHALL 分别提供用户已发送和已收到的牵线请求列表。已发送请求显示完整状态（PENDING/ACCEPTED/REJECTED/EXPIRED）。已收到请求仅显示 PENDING 状态的。

#### Scenario: 查看已发送的请求
- **WHEN** 用户 A 请求查看已发送的牵线列表
- **THEN** 系统返回 A 发出的所有请求及其状态，附带目标用户的匿名画像（仅标签）

#### Scenario: 查看已收到的请求
- **WHEN** 用户 B 请求查看收到的牵线列表
- **THEN** 系统仅返回 PENDING 状态的请求，附带发送方的匿名画像（仅标签）

### Requirement: 接受后解锁双方信息
牵线请求被接受后，系统 SHALL 为双方解锁昵称和头像。此信息通过 Relationship 详情获取。

#### Scenario: 接受后信息解锁
- **WHEN** 用户 A 和 B 之间的牵线请求被接受
- **THEN** 双方均可通过创建的 Relationship 查看对方的昵称和头像
