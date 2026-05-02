## 1. 创建 genderUtils 工具模块

- [x] 1.1 新建 `client/src/lib/genderUtils.ts`，实现 `genderLabel()`、`genderIcon()`、`genderTagStyle()` 函数
- [x] 1.2 将 `getAuraGradient()` 和 AURA 色板常量从 `DiscoveryPage.tsx` 迁入 `genderUtils.ts`，扩展 `AURA_OTHER` 为 3 组渐变

## 2. 更新性别选择器

- [x] 2.1 `ProfileSetupPage.tsx` — 性别选项从 `['male', 'female']` 改为 `['male', 'female', 'non_binary']`，按钮文字使用 `genderLabel()`
- [x] 2.2 `ProfilePage.tsx` — 同上，性别选项新增 `'non_binary'`，按钮文字使用 `genderLabel()`

## 3. 更新展示组件

- [x] 3.1 `DiscoveryPage.tsx` — 替换所有内联性别渲染为 `genderUtils` 函数调用（约 8 处：soul card gender-icon、各 tab card 的性别标签、关系卡片双人信息）
- [x] 3.2 `WingmanHallPage.tsx` — 替换内联性别渲染为 `genderUtils` 函数调用（标签样式和文字）

## 4. 验证

- [x] 4.1 本地测试：注册引导选择"非二元"→ 个人资料显示"非二元"→ 发现页卡片正确渲染
- [x] 4.2 本地测试：军师厅任务卡片正确显示"非二元"性别标签
