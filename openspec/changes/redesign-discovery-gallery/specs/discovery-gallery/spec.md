## ADDED Requirements

### Requirement: 水平滚动画廊布局
系统 SHALL 在"发现" tab 下渲染水平滚动画廊，包含 Header、Featured、About、Stats、Soul Cards 五个 section，用户通过垂直滚动驱动水平位移。

#### Scenario: 用户进入发现页
- **WHEN** 用户导航到发现页
- **THEN** 页面显示画廊入口动画（nav bar 滑入、track lines 展开、header 文字逐行入场、header blocks 渐显）

#### Scenario: 用户向下滚动浏览画廊
- **WHEN** 用户向下滚动
- **THEN** 内容容器水平向左位移，右侧自定义滚动条同步更新 thumb 位置
- **AND** 各 section 在进入视口时触发入场动画

### Requirement: GSAP + Lenis 动画体系
系统 SHALL 使用 GSAP ScrollTrigger 驱动水平滚动动画，使用 Lenis 提供平滑滚动体验。所有动画实例 SHALL 在组件卸载时正确清理。

#### Scenario: 动画初始化
- **WHEN** DiscoveryPage 组件挂载
- **THEN** Lenis 实例初始化并与 ScrollTrigger 联动
- **AND** 计算 container 总宽度和滚动高度
- **AND** 创建 ScrollTrigger 实例驱动水平位移

#### Scenario: 组件卸载清理
- **WHEN** 用户离开发现页
- **THEN** 所有 GSAP timeline 和 ScrollTrigger 实例被 kill
- **AND** Lenis 实例被销毁

#### Scenario: 窗口 resize
- **WHEN** 浏览器窗口大小改变
- **THEN** ScrollTrigger 刷新，卡片和 section 的 reveal 状态重置，布局重新计算

### Requirement: Soul Card 渲染与数据绑定
系统 SHALL 从 `/discovery/users` API 获取真实用户数据，渲染为水平排列的 Soul Card。每张卡片 SHALL 显示 aura 渐变（基于性别/兴趣）、性别标识、校区年级、恋爱宣言、兴趣标签。

#### Scenario: 用户列表加载成功
- **WHEN** API 返回用户列表
- **THEN** 每个用户渲染为一张 Soul Card，aura 使用性别关联渐变色
- **AND** 卡片在水平滚动进入视口时触发 clip-path + 文字入场动画

#### Scenario: 用户列表为空
- **WHEN** API 返回空列表
- **THEN** 显示"暂无活跃灵魂"提示

#### Scenario: 用户发起牵线
- **WHEN** 用户点击 Soul Card 上的"牵线"按钮
- **THEN** 弹出确认弹窗（消耗 5 信用分）
- **AND** 确认后调用 `/discovery/match-request` API

### Requirement: Featured 精选灵魂 section
系统 SHALL 在画廊中渲染 Featured section，展示一条精选恋爱宣言，使用大面积 aura 渐变背景 + glassmorphism 覆盖层。

#### Scenario: Featured section 入场
- **WHEN** 画廊滚动到 Featured section 位置
- **THEN** tip 标签滑入、aura 卡片缩放展开、边框渐显、quote 和 author 文字淡入

#### Scenario: Featured 数据
- **WHEN** Featured section 渲染
- **THEN** 展示的 quote 来自真实用户宣言或预设文案（当无合适数据时 fallback）

### Requirement: Stats 校园数据 section
系统 SHALL 在画廊中渲染 Stats section，展示活跃灵魂数、今日心动数等统计数据，带动画进度条。

#### Scenario: Stats section 入场
- **WHEN** 画廊滚动到 Stats section 位置
- **THEN** 标题滑入、各数据行逐行入场、进度条从 0 动画到目标值

#### Scenario: Stats 数据来源
- **WHEN** Stats section 渲染
- **THEN** 活跃灵魂数从 `/discovery/users` 的 total 字段获取
- **AND** 其他统计项使用前端 mock 数据

### Requirement: 固定导航栏
系统 SHALL 在页面顶部渲染固定导航栏，包含 Violet logo、4 个 tab 按钮（发现/已发起/收到心动/关系）、信用分显示、军师大厅/管理/个人中心/退出按钮。

#### Scenario: 导航栏入场
- **WHEN** 页面加载完成
- **THEN** 导航栏从顶部滑入并固定

#### Scenario: Tab 切换到"已发起"
- **WHEN** 用户点击"已发起" tab
- **THEN** 画廊隐藏，显示已发起的牵线请求列表（使用画廊视觉风格但垂直/简化布局）
- **AND** 每条请求显示目标用户信息和状态标签

#### Scenario: Tab 切换到"收到心动"
- **WHEN** 用户点击"收到心动" tab
- **THEN** 显示收到的牵线请求列表，每条请求带"接受"和"不合适"按钮
- **AND** tab 上显示未处理请求数量的红色徽章

#### Scenario: Tab 切换到"关系"
- **WHEN** 用户点击"关系" tab
- **THEN** 显示活跃关系列表（当事人视角和军师视角），带"进入聊天"按钮

#### Scenario: Tab 切换回"发现"
- **WHEN** 用户从其他 tab 切回"发现"
- **THEN** 画廊重新初始化并播放入场动画

### Requirement: 环境氛围背景
系统 SHALL 渲染固定的环境氛围背景层，包含三个 bokeh blob 动画和一个 noise overlay。

#### Scenario: 背景始终可见
- **WHEN** 页面加载
- **THEN** 三个渐变色 blob 以不同速度和方向缓慢漂移
- **AND** noise overlay 以极低透明度覆盖全屏

### Requirement: 响应式适配
系统 SHALL 在窄屏设备上调整画廊参数，通过 CSS 变量 `--scale` 控制元素尺寸。

#### Scenario: 窄屏设备访问
- **WHEN** 屏幕宽高比小于 4:5
- **THEN** `--scale` 增大到 1.4，Soul Card 高度减小，导航栏隐藏部分按钮和 tabs
