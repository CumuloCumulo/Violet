## Why

当前 Violet 的性别选择只有"男生"和"女生"两个选项，无法覆盖非二元性别用户。需要新增"非二元"性别选项，使产品对所有性别认同的用户都友好包容。

## What Changes

- 在注册引导（ProfileSetupPage）和个人资料编辑（ProfilePage）的性别选择器中新增"非二元"选项
- 在发现页（DiscoveryPage）的卡片中正确显示"非二元"性别标签和对应的 aura 渐变色
- 在军师厅（WingmanHallPage）的任务卡片中正确显示"非二元"性别标签
- 修复关系卡片中 gender 渲染缺少 other fallback 的 bug
- 统一性别标签的视觉样式（颜色、图标）

## Capabilities

### New Capabilities

- `gender-display`: 统一的性别渲染逻辑，包括标签文字、图标、aura 渐变色、标签配色的映射规则

### Modified Capabilities

## Impact

- **前端组件**: ProfileSetupPage、ProfilePage、DiscoveryPage、WingmanHallPage
- **后端**: 无需修改（`gender` 字段为 `String?`，天然支持任意字符串值）
- **数据库**: 无需修改 schema 或 migration
- **现有数据**: 已有用户的 gender 值（`male`/`female`/`null`）不受影响
