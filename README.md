# Violet - NJU代恋 | 校园恋爱代聊平台

## 项目简介

NJU代恋是一个面向南京大学学生的校园恋爱代聊平台。平台通过"军师"（恋爱顾问）辅助"当事人"进行破冰和关系推进，解决大学生"想谈恋爱但缺乏渠道"的真实痛点。

### 核心业务流程

- **牵线期**：双方匿名初步交流，了解基本标签信息
- **破冰期**：双方确认后进入，军师可介入辅助（代聊、建议等）
- **暧昧期**：当事人交换联系方式，转到微信/QQ继续

### 核心功能

- 南大邮箱注册认证
- 双重身份（当事人 / 军师）
- 四人三边聊天室（当事人×2 + 军师×2）
- 军师三种介入模式（Solo代聊、私聊、辅助）
- 军师大厅与任务发布
- 信用分经济体系
- 帖子大厅（匿名求助）
- 活跃度标签展示

## 团队成员

| 成员 | 角色 | 主导阶段 |
|------|------|----------|
| 王宇晗 | 需求负责人 | P1（需求分析） |
| 朱玄 | 架构负责人 | P2（体系结构设计） |
| 靳滨硕 | 开发负责人 | P4（核心编码） |
| 庄永琪 | 测试负责人 | P6（质量保障与重构） |

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React + Vite |
| 前端样式 | Tailwind CSS |
| 状态管理 | Zustand |
| 后端框架 | NestJS (Node.js) |
| 实时通信 | Socket.io |
| 数据库 | PostgreSQL |
| ORM | Prisma |
| 缓存 | Redis |
| 邮件服务 | Nodemailer |

## 项目结构

```
Violet/
├── docs/                   # 项目文档
│   ├── P0/                 # P0 项目启动
│   ├── P1/                 # P1 需求分析
│   └── ...
├── client/                 # 前端项目（React + Vite + Tailwind CSS）
├── server/                 # 后端项目（NestJS）
├── .github/                # GitHub Actions CI配置
├── .gitignore
└── README.md
```

## 开发环境搭建

### 前置要求

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 15
- Redis >= 7

### 快速开始

```bash
# 克隆仓库
git clone https://github.com/<your-org>/Violet.git
cd Violet

# 安装前端依赖
cd client && pnpm install

# 安装后端依赖
cd ../server && pnpm install

# 配置环境变量
cp server/.env.example server/.env
# 编辑 .env 填入数据库连接等配置

# 启动开发服务器
# 前端
cd client && pnpm dev

# 后端
cd server && pnpm start:dev
```

## 分支策略

```
main        # 稳定版本
 └── dev    # 开发主线
      ├── feature/xxx  # 功能分支
      └── fix/xxx      # 修复分支
```

## Commit 规范

- 格式：`[阶段] 类型: 描述`
- 标注AI使用：`[AI-assisted]` 或 `[Human-written]`
- 示例：`[P4] feat[AI-assisted]: 实现四人聊天室核心逻辑`

## 课程信息

- **课程**：软件工程与计算II
- **项目周期**：10周
- **团队规模**：4人/组
