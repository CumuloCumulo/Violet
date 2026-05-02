## Context

当前 Violet 的性别字段 `gender: String?` 在 Prisma schema 中为自由字符串，后端无枚举校验。前端硬编码为 `['male', 'female']` 二选一，所有展示层使用三元表达式渲染。发现页已有 `AURA_OTHER` 色板但内容较单调（仅 2 组渐变），且部分卡片渲染缺少 other fallback。

涉及的展示点散落在 4 个页面约 10 处代码中，存在大量重复的三元/嵌套三元逻辑。

## Goals / Non-Goals

**Goals:**

- 新增 `'non_binary'` 作为第三个性别选项，前端显示为"非二元"
- 所有性别展示点统一支持三种性别的渲染（文字、图标、颜色）
- 收拢散落的性别渲染逻辑，提取为可复用的 helper

**Non-Goals:**

- 不修改数据库 schema 或新增 migration
- 不做自定义性别输入（仅新增一个固定选项）
- 不修改后端代码（`gender: String?` 天然支持）
- 不修改匹配/推荐算法中的性别逻辑（目前没有性别过滤）

## Decisions

### 1. 存储值使用 `'non_binary'`

**选择**: `'non_binary'`
**备选**: `'other'`、`'non-binary'`、`'nonbinary'`

理由：避免连字符（URL/query string 友好），语义明确，与现有 `'male'`/`'female'` 风格一致（下划线 snake_case）。

### 2. 提取 `genderUtils.ts` 工具模块

**选择**: 新建 `client/src/lib/genderUtils.ts`，导出统一映射函数
**备选**: 在每个组件内就地扩展三元表达式

理由：当前约 10 处渲染逻辑需要同步修改，提取 helper 可消除重复、降低遗漏风险。函数包括：
- `genderLabel(gender)` → `'男'` / `'女'` / `'非二元'`
- `genderIcon(gender)` → `'♂'` / `'♀'` / `'◯'`
- `genderTagStyle(gender)` → `{ background, color }`
- `getAuraGradient(userId, gender)` → 从 DiscoveryPage 迁入，扩展 AURA_OTHER 色板

### 3. 非二元标签配色使用薄荷紫

**选择**: `background: rgba(160, 180, 220, 0.15)`, `color: '#7a82a8'`（中性淡紫）
**备选**: 薄荷绿、灰色、彩虹渐变

理由：既区别于男（蓝）和女（粉），又保持整体配色的柔和印象派调性。

### 4. AURA_OTHER 扩展为 3 组渐变

当前只有 2 组，新增后会显得单调。扩展为 3 组中性色渐变，与 AURA_MALE 和 AURA_FEMALE 的 3 组对齐。

## Risks / Trade-offs

- **[已有数据显示]** 现有数据库中不存在 `'non_binary'` 值的用户，无需数据迁移 → 无风险
- **[seed 数据]** seed.ts 中硬编码了 `'male'`/`'female'`，建议补充一个 `'non_binary'` 测试用户 → 低优先级
- **[关系卡片 bug]** `DiscoveryPage.tsx:818,823` 的双人卡片缺少 other fallback，gender 不为 male 时都显示"女" → 本次一并修复
