## ADDED Requirements

### Requirement: 用户可进入个人中心
已登录用户 SHALL 能够从 DiscoveryPage 进入个人中心页面。个人中心 SHALL 展示用户当前的全部资料信息。

#### Scenario: 从发现页进入个人中心
- **WHEN** 用户在 DiscoveryPage 点击个人中心入口
- **THEN** 系统导航到 ProfilePage，展示用户当前资料

### Requirement: 用户可查看个人资料
ProfilePage SHALL 展示用户的昵称、性别、校区、年级、专业、兴趣标签、恋爱宣言、头像。

#### Scenario: 查看完整资料
- **WHEN** 用户进入 ProfilePage
- **THEN** 页面展示所有已填写的个人资料字段，未填写的字段显示占位提示

### Requirement: 用户可编辑个人资料
用户 SHALL 能够在 ProfilePage 中编辑性别、校区、年级、专业、兴趣标签、恋爱宣言，并保存更改。

#### Scenario: 编辑并保存资料
- **WHEN** 用户修改任意资料字段并点击保存
- **THEN** 系统调用 PATCH `/api/user/profile` 更新资料，成功后 authStore 中的用户信息同步更新

#### Scenario: 保存失败提示
- **WHEN** 保存请求失败
- **THEN** 页面显示错误提示信息，已修改的内容保留在表单中

### Requirement: 用户可查看信用分和签到
ProfilePage SHALL 展示用户当前信用分，并提供每日签到按钮。

#### Scenario: 查看信用分
- **WHEN** 用户进入 ProfilePage
- **THEN** 页面展示当前信用分数值

#### Scenario: 签到成功
- **WHEN** 用户点击签到按钮且今日未签到
- **THEN** 系统调用 POST `/api/credit/checkin`，信用分增加，按钮变为已签到状态

#### Scenario: 重复签到
- **WHEN** 用户点击签到按钮但今日已签到
- **THEN** 按钮显示已签到状态，点击无效果或提示"今日已签到"

### Requirement: 用户可查看角色和认证状态
ProfilePage SHALL 展示用户的角色标签（当事人/军师）和军师认证状态。

#### Scenario: 查看角色
- **WHEN** 用户进入 ProfilePage
- **THEN** 页面展示当前角色（CLIENT、WINGMAN）的标签

#### Scenario: 查看军师认证状态
- **WHEN** 用户具有军师相关状态
- **THEN** 页面展示认证状态（未申请/已通过/已驳回）

### Requirement: 用户可退出登录
ProfilePage SHALL 提供退出登录按钮。

#### Scenario: 退出登录
- **WHEN** 用户点击退出登录按钮
- **THEN** 系统调用 logout，清除登录状态，导航到登录页面

### Requirement: 用户可返回发现页
ProfilePage SHALL 提供返回 DiscoveryPage 的导航入口。

#### Scenario: 返回发现页
- **WHEN** 用户点击返回按钮
- **THEN** 系统导航回 DiscoveryPage
