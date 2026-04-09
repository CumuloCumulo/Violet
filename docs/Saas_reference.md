Title: How to Build a Full-Stack SaaS App with TanStack Start, Elysia, and Neon
URL Source: https://www.freecodecamp.org/news/full-stack-saas-tanstack-start-elysia-neon/?ref=dailydev
Published: 2026-04-02T15:47:39.364Z
Markdown Content:
How to Build a Full-Stack SaaS App with TanStack Start, Elysia, and Neon
===============
![Image 1: 如何使用 TanStack Start、Elysia 和 Neon 构建全栈 SaaS 应用](https://cdn.hashnode.com/uploads/covers/5e1e335a7a1d3fcc59028c64/ae3ac13a-e6b4-4498-aa32-ebd8c60c44a2.png)

大多数全栈 React 教程都止步于"Hello World"。它们会教你如何渲染组件，或许还会获取一些数据，然后就结束了。
但是，当你真正开始构建一个SaaS应用程序时，你会立刻遇到一大堆未解之谜。数据库应该如何构建？身份验证应该放在哪里？如何保证API调用的类型安全？如何在不丢失Webhook的情况下处理支付？
本手册解答了所有这些问题。您将使用 TanStack Start、Elysia、Drizzle ORM、Neon PostgreSQL、Better Auth、Stripe 和 Inngest 从零开始构建一个可用于生产环境的 SaaS 应用程序。
最终，您将拥有一个已部署的应用程序，该应用程序具有身份验证、类型安全的 API、数据库迁移、支付处理和后台作业功能。
在用 Next.js、Express 和 Prisma 构建生产应用之后，我选择了这套技术栈。TanStack Start 和 Elysia 与 Eden Treaty 的结合，带来了一种难得的优势：从数据库模式到 React 组件，全程实现类型安全，而且无需任何代码生成。
当你更改数据库中的一列时，TypeScript 会通知你所有需要更新的地方。这种反馈循环改变了你构建软件的方式。
你将学到以下内容：
* 如何使用 Vite 和基于文件的路由设置 TanStack Start 项目
* 如何使用 Drizzle ORM 和 Neon 配置 PostgreSQL 数据库
* 如何在 Web 应用中嵌入 Elysia 并构建类型安全的 API
* 如何使用 Eden Treaty 将前端连接到 API
* 如何使用 Better Auth 添加 GitHub OAuth 身份验证
* 如何使用可重复的四层模式构建完整的功能
* 如何使用 Stripe Webhook 处理付款
* 如何使用 Inngest 运行可靠的后台作业
* 如何使用 Neon 将所有内容部署到 Vercel

### 为什么选择 TanStack Start 而不是 Next.js？

你可能会问——为什么不直接用 Next.js 呢？它是全栈 React 的默认选择，而且理由充分。Next.js 开创了服务器端渲染的先河，建立了塑造 React 生态系统的诸多规范，并且拥有所有 React 框架中最大的社区。
但 TanStack Start 具有三个对这类项目至关重要的优势。

#### 1\. 部署灵活性

TanStack Start 会编译成标准的 JavaScript，可以在任何地方运行：Node.js、Bun、Deno、Cloudflare Workers、AWS Lambda 或您自己的服务器。众所周知，Next.js 在 Vercel 之外很难自行托管。
如果你搜索"Next.js Azure 应用服务容器"或"Next.js ISR 自托管"，你会发现 Stack Overflow 上多年来关于仅在生产环境中出现的极端情况的问题。

#### 2\. 更简单的心理模型

Next.js 已经变得非常复杂：应用路由、React 服务器组件、服务器操作、部分预渲染，`cache()` 以及 `unstable_cache()` 各种渲染策略。
TanStack Start 使用全文档 SSR 和完全水合，避免了服务器/客户端边界模糊的问题。虽然无法实现 RSC 的细粒度流式传输，但却获得了更高的清晰度和可预测性。

#### 3\. 端到端类型安全

结合 Elysia 和 Eden Treaty，TanStack Start 可实现从数据库到 UI 的编译时类型推断。无需代码生成步骤，也无需维护同步任何模式文件。
TanStack Router 本身提供完全类型安全的路由，并可推断路径参数、搜索参数和加载器数据。
这是一本操作手册，所以内容很深入。抽出几个小时，打开你的编辑器，让我们一起构建一些实际的东西。

## 目录

* [先决条件](https://www.freecodecamp.org/news/full-stack-saas-tanstack-start-elysia-neon/?ref=dailydev#heading-prerequisites)
* [如何设置项目](https://www.freecodecamp.org/news/full-stack-saas-tanstack-start-elysia-neon/?ref=dailydev#heading-how-to-set-up-the-project)
* [如何使用 Drizzle 和 Neon 配置数据库](https://www.freecodecamp.org/news/full-stack-saas-tanstack-start-elysia-neon/?ref=dailydev#heading-how-to-configure-the-database-with-drizzle-and-neon)
* [如何使用 Elysia 构建 API](https://www.freecodecamp.org/news/full-stack-saas-tanstack-start-elysia-neon/?ref=dailydev#heading-how-to-build-the-api-with-elysia)
* [如何使用 Eden Treaty 添加类型安全的 API 调用](https://www.freecodecamp.org/news/full-stack-saas-tanstack-start-elysia-neon/?ref=dailydev#heading-how-to-add-type-safe-api-calls-with-eden-treaty)
* [如何使用 Better Auth 添加身份验证](https://www.freecodecamp.org/news/full-stack-saas-tanstack-start-elysia-neon/?ref=dailydev#heading-how-to-add-authentication-with-better-auth)
* [如何构建一个完整的功能（四层模式）](https://www.freecodecamp.org/news/full-stack-saas-tanstack-start-elysia-neon/?ref=dailydev#heading-how-to-build-a-complete-feature-the-four-layer-pattern)
* [如何使用 Stripe 添加付款](https://www.freecodecamp.org/news/full-stack-saas-tanstack-start-elysia-neon/?ref=dailydev#heading-how-to-add-payments-with-stripe)
* [如何使用 Inngest 添加后台作业](https://www.freecodecamp.org/news/full-stack-saas-tanstack-start-elysia-neon/?ref=dailydev#heading-how-to-add-background-jobs-with-inngest)
* [如何使用 Neon 部署到 Vercel](https://www.freecodecamp.org/news/full-stack-saas-tanstack-start-elysia-neon/?ref=dailydev#heading-how-to-deploy-to-vercel-with-neon)
* [结论](https://www.freecodecamp.org/news/full-stack-saas-tanstack-start-elysia-neon/?ref=dailydev#heading-conclusion)

## 先决条件

开始之前，请确保已安装以下软件：
* [**Bun**](https://bun.sh/)（v1.2 或更高版本）用于软件包管理和运行脚本
* [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)用于在本地运行 PostgreSQL 的[**Docker**](https://www.docker.com/products/docker-desktop/)
* [**Git**](https://git-scm.com/)用于版本控制
* 具备 React 和 TypeScript 的基础知识
您还需要这些服务的免费帐户：
* [https://neon.tech/](https://neon.tech/)适用于生产环境 PostgreSQL 数据库的[**Neon**](https://neon.tech/)
* [**Vercel**](https://vercel.com/)部署
* [**用于 OAuth 身份验证的GitHub**](https://github.com/)（您将创建一个 OAuth 应用）
* [**Stripe**](https://stripe.com/)用于支付处理（测试模式免费）
所有这些服务都提供慷慨的免费套餐。您无需支付任何费用即可学习本教程。
您还应该能够轻松阅读 TypeScript 代码。本手册假定您理解泛型、类型推断和 async/await。如果您是 TypeScript 新手，[官方手册](https://www.typescriptlang.org/docs/handbook/)是一个很好的起点。

## 如何设置项目

首先创建一个新的 TanStack Start 项目。TanStack 提供了一个 CLI，可以自动搭建一个包含基于文件的路由、Vite 和服务器端渲染的项目。
```bash
bunx @tanstack/cli@latest create my-saas
cd my-saas
bun install
```
CLI会询问你几个问题。选择React作为框架，其余选项接受默认设置。
您使用的是 Bun 作为包管理器和运行时环境。Bun 在安装依赖项和运行脚本方面比 npm 快得多。它还原生支持 TypeScript 执行，这意味着您可以 `.ts` 直接运行文件而无需编译步骤。
如果你更喜欢 npm 或 pnpm，命令也类似，但本教程全程使用 Bun。

### 如何理解项目结构

在编写任何代码之前，我们先来看看如何组织这个项目。关键的架构决策是将所有库代码放在一个单独的目录下。每个集成（数据库、身份验证、支付等等）都有自己的目录，并通过一个 `index.ts` 文件提供清晰的公共 API。
这是你要构建的结构：
```text
my-saas/
├── src/
│ ├── components/ # React components
│ ├── hooks/ # Custom React hooks
│ ├── lib/
│ │ ├── auth/ # Better Auth (server + client)
│ │ ├── db/ # Drizzle ORM + schema
│ │ ├── jobs/ # Inngest background jobs
│ │ └── payments/ # Stripe integration
│ ├── routes/ # TanStack file-based routing
│ ├── server/
│ │ ├── api.ts # Elysia API definition
│ │ └── routes/ # API route modules
│ └── start.ts # TanStack Start entry point
├── docker-compose.yml # Local PostgreSQL + Neon proxy
├── drizzle.config.ts # Drizzle Kit configuration
├── vite.config.ts # Vite + TanStack Start config
└── package.json
```
以下是各个部分之间的联系：
![Image 2: 全栈 SaaS 架构图展示了 TanStack Start 如何处理前端，它连接到嵌入式 Elysia API 服务器，该服务器集成了 Better Auth 用于身份验证、Stripe 用于支付以及 Inngest 用于后台任务，并通过 Drizzle ORM 提供对 Neon PostgreSQL 的类型安全数据库访问。](https://cdn.hashnode.com/uploads/covers/69a694d8d4dc9b42434c218f/5bf61d3b-0587-445a-8be1-79f869aa554b.png)

TanStack Start 负责前端开发。它与嵌入在同一项目中的 Elysia API 服务器通信。Elysia 连接到三个外部服务：Better Auth 用于身份验证，Stripe 用于支付，Inngest 用于后台任务。在 API 层之下，Drizzle ORM 提供对 Neon PostgreSQL 的类型安全数据库访问。
您将逐层构建，从数据库开始。
这种模式确保每个集成都是独立的。当需要更改身份验证方式时，您需要访问相应的集成 `src/lib/auth/`；当需要修改数据库架构时，您需要访问 `src/lib/db/` 相应的集成。这样就不会出现跨集成泄露的情况。

### 如何配置 Vite

TanStack Start 运行在 Vite 上。您的 `vite.config.ts` 需要 TanStack Start 插件、React 插件以及 `@/` 导入别名的路径解析：
```tsx
// vite.config.ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
export default defineConfig({
server: {
port: 3000,
},
plugins: [
tsConfigPaths({
projects: ["./tsconfig.json"],
}),
tanstackStart(),
viteReact(),
],
});
```
该 `tsConfigPaths` 插件会从您的配置文件中读取设置，因此您可以在代码中使用它 `@/lib/db` 而不是它 `../../lib/db`。
将此 `tsconfig.json`：
```json
{
"compilerOptions": {
"baseUrl": ".",
"paths": {
"@/*": ["./src/*"]
}
}
}
```

### 如何安装依赖项

安装本教程中需要用到的核心依赖项：
```text

# Framework and routing

bun add @tanstack/react-router @tanstack/react-start react react-dom

# API layer

bun add elysia @elysiajs/eden

# Database

bun add drizzle-orm @neondatabase/serverless ws
bun add -d drizzle-kit

# Authentication

bun add better-auth

# Payments

bun add stripe

# Background jobs

bun add inngest

# Build tools

bun add -d @vitejs/plugin-react vite vite-tsconfig-paths typescript
```
现在您已经拥有一个包含所有必要依赖项的可运行的 TanStack Start 项目。启动开发服务器以确保一切正常：
```bash
bun run dev
```
访问该网站 `http://localhost:3000`，您应该可以看到您的应用程序正在运行。

## 如何使用 Drizzle 和 Neon 配置数据库

每个 SaaS 应用都需要数据库。您将使用 Drizzle ORM 和 Neon PostgreSQL。Drizzle 提供类型安全的数据库查询，其形式类似于 SQL；而 Neon 则提供了一个无服务器的 PostgreSQL 数据库，在您不使用时可以自动缩减至零。

### 为什么选择 Drizzle 而不是 Prisma？

如果你之前在 TypeScript 生态系统中使用过 ORM，那很可能是 Prisma。Prisma 在很多情况下都很出色，但它在这个架构中存在一个关键的限制：它使用了代码生成。
你编写一个 `.prisma` 模式文件，运行命令 `prisma generate`，Prisma 就会生成一个 TypeScript 客户端。这个生成步骤会增加开发流程的复杂性，并产生需要保持同步的工件。
Drizzle 采用不同的方法。你的模式是 TypeScript，你的查询也是 TypeScript。类型在编译时自动推断，无需任何生成步骤。
向表中添加列时，类型会立即更新。这与整个技术栈完美契合，类型信息会从 Drizzle 经由 Elysia 流向 Eden Treaty，无需任何中间步骤。
Drizzle 生成的 SQL 语句看起来也像 SQL。如果您了解 PostgreSQL，就可以阅读 Drizzle 查询语句。无需学习 Prisma 特有的查询语言。

### 如何使用 Docker 设置本地 PostgreSQL

对于本地开发，您需要在 Docker 中运行 PostgreSQL，并使用与 Neon 兼容的代理。这样，您就可以在本地使用与生产环境相同的 Neon 无服务器驱动程序。
在项目根目录下创建一个 `docker-compose.yml`：
```bash

# docker-compose.yml

services:
postgres:
image: postgres:17
container_name: my-saas-postgres
restart: unless-stopped
ports:
- "5432:5432"
environment:
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres
POSTGRES_DB: my_saas
volumes:
- postgres_data:/var/lib/postgresql/data
healthcheck:
test: ["CMD-SHELL", "pg_isready -U postgres"]
interval: 10s
timeout: 5s
retries: 5
neon-proxy:
image: ghcr.io/timowilhelm/local-neon-http-proxy:main
container_name: my-saas-neon-proxy
restart: unless-stopped
environment:
- PG_CONNECTION_STRING=postgres://postgres:postgres@postgres:5432/my_saas
ports:
- "4444:4444"
depends_on:
postgres:
condition: service_healthy
volumes:
postgres_data:
```
容器 `neon-proxy` 是关键所在。它将 HTTP 请求转换为 PostgreSQL 网络协议，这意味着您的 Neon 无服务器驱动程序无需任何代码更改即可在本地运行。
在生产环境中，Neon 会在其基础设施上处理这种转换。而在本地环境中，您需要这个代理来弥合基于 HTTP 的 Neon 驱动程序和您的纯 PostgreSQL 容器之间的差距。
PostgreSQL 容器上的 `healthcheck` 机制确保代理仅在数据库准备就绪后才启动。如果没有此机制，代理会尝试连接到仍在初始化的数据库，从而导致首次启动时出现连接错误。
启动容器：
```bash
docker compose up -d
```

### 如何定义你的模式

创建数据库客户端和架构。首先创建 `src/lib/db/index.ts` 进行连接：
```javascript
// src/lib/db/index.ts
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";
import * as schema from "./schema";
const isProduction = process.env.NODE_ENV === "production";
const LOCAL_DB_HOST = "db.localtest.me";
let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
throw new Error("DATABASE_URL environment variable is not set");
}
neonConfig.webSocketConstructor = ws;
if (!isProduction) {
connectionString = `postgres://postgres:postgres@${LOCAL_DB_HOST}:5432/my_saas`;
neonConfig.fetchEndpoint = (host) => {
const [protocol, port] =
host === LOCAL_DB_HOST ? ["http", 4444] : ["https", 443];
return `${protocol}://${host}:${port}/sql`;
};
neonConfig.useSecureWebSocket = false;
neonConfig.wsProxy = (host) =>
host === LOCAL_DB_HOST ? `${host}:4444/v2` : `${host}/v2`;
}
const client = neon(connectionString);
export const db = drizzle({ client, schema });
export * from "./schema";
```
主机名 `db.localtest.me` 解析为 `127.0.0.1` 本地 Neon 代理，这是使用本地 Neon 代理的标准方式。在生产环境中，Neon 驱动程序使用 `DATABASE_URL` 环境变量直接连接到您的 Neon 数据库。
现在定义你的 `src/lib/db/schema.ts`。对于 SaaS 应用，你需要用户、会话、账户（用于 OAuth）以及一个用于存储核心业务实体的表。以下是一个实际生产环境的数据库模式示例：
```ts
// src/lib/db/schema.ts
import {
boolean,
integer,
pgEnum,
pgTable,
text,
timestamp,
varchar,
} from "drizzle-orm/pg-core";
export const purchaseTierEnum = pgEnum("purchase_tier", ["pro"]);
export const purchaseStatusEnum = pgEnum("purchase_status", [
"completed",
"partially_refunded",
"refunded",
]);
export const users = pgTable("users", {
id: text("id").primaryKey(),
email: varchar("email", { length: 255 }).notNull().unique(),
emailVerified: boolean("email_verified").notNull().default(false),
name: text("name"),
image: text("image"),
createdAt: timestamp("created_at").notNull().defaultNow(),
updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const sessions = pgTable("sessions", {
id: text("id").primaryKey(),
userId: text("user_id")
.notNull()
.references(() => users.id, { onDelete: "cascade" }),
token: text("token").notNull().unique(),
expiresAt: timestamp("expires_at").notNull(),
ipAddress: text("ip_address"),
userAgent: text("user_agent"),
createdAt: timestamp("created_at").notNull().defaultNow(),
updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const accounts = pgTable("accounts", {
id: text("id").primaryKey(),
userId: text("user_id")
.notNull()
.references(() => users.id, { onDelete: "cascade" }),
accountId: text("account_id").notNull(),
providerId: text("provider_id").notNull(),
accessToken: text("access_token"),
refreshToken: text("refresh_token"),
accessTokenExpiresAt: timestamp("access_token_expires_at"),
refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
scope: text("scope"),
createdAt: timestamp("created_at").notNull().defaultNow(),
updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const verifications = pgTable("verifications", {
id: text("id").primaryKey(),
identifier: text("identifier").notNull(),
value: text("value").notNull(),
expiresAt: timestamp("expires_at").notNull(),
createdAt: timestamp("created_at").notNull().defaultNow(),
updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const purchases = pgTable("purchases", {
id: text("id")
.primaryKey()
.$defaultFn(() => crypto.randomUUID()),
userId: text("user_id")
.notNull()
.references(() => users.id, { onDelete: "cascade" }),
stripeCheckoutSessionId: text("stripe_checkout_session_id")
.notNull()
.unique(),
stripeCustomerId: text("stripe_customer_id"),
stripePaymentIntentId: text("stripe_payment_intent_id"),
tier: purchaseTierEnum("tier").notNull(),
status: purchaseStatusEnum("status").notNull().default("completed"),
amount: integer("amount").notNull(),
currency: text("currency").notNull().default("usd"),
purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
createdAt: timestamp("created_at").notNull().defaultNow(),
updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Type exports for use in your application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
```
推送架构以创建表：
```bash
bun run db:push
```
关于这个模式，有几点需要注意：
1. Better Auth 需要 `users`、`sessions`、`accounts` 和 `verifications` 表。您将在下一节中配置身份验证库以使用这些表。
2. 该 `purchases` 表是您的核心业务实体。它跟踪 Stripe 结账会话并将其与用户关联起来。
3. 类型导出功能 `User` 会 `Purchase` 根据你的模式推断出 TypeScript 类型。你无需手动定义类型，它们都来自模式定义。
4. 插入行时，该列会自动生成 UUID。身份验证表使用文本 ID，因为 Better Auth 会生成自己的 ID。`purchases.id` 的 `$defaultFn` 也会自动生成 UUID。

### 如何配置 Drizzle Kit

在项目根目录下创建 `drizzle.config.ts`：
```javascript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
dialect: "postgresql",
schema: "./src/lib/db/schema.ts",
out: "./drizzle",
dbCredentials: {
url: process.env.DATABASE_URL!,
},
verbose: true,
strict: true,
});
```
将这些脚本添加到您的 `package.json`：
```json
{
"scripts": {
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
}
}
```
现在将您的数据库架构推送到本地数据库：
```bash
bun run db:push
```
Drizzle Kit 会读取您的模式文件，将其与数据库进行比较，并应用任何更改。对于开发环境，`db:push` 它快速便捷。对于生产环境，您将使用其他工具 `db:generate` 来 `db:migrate` 创建版本化的 SQL 迁移文件。
您可以打开 Drizzle Studio 以可视化的方式查看您的数据库：
```bash
bun run db:studio
```
这将打开一个 Web 用户界面。您可以在 `https://local.drizzle.studio` 中浏览表格、运行查询和检查数据。

## 如何使用 Elysia 构建 API

这套技术栈的有趣之处就在这里。它无需运行单独的 API 服务器，而是将 Elysia 直接嵌入到 TanStack Start 中。这样，Web 应用和 API 都运行在同一个进程中，共享相同的类型，并作为一个整体进行部署。

### 为什么选择 Elysia 而不是 Express？

如果你之前构建过 Node.js API，那么你很可能用过 Express。它已经有 15 年的历史，并且拥有庞大的生态系统。但是 Express 的设计早于 TypeScript、async/await，也早于开发者对全栈类型安全的期望。
Elysia 采用了不同的方法。它从一开始就是为 TypeScript 设计的。请求体、响应类型和路径参数都在编译时推断出来。
结合 Eden Treaty（您将在下一节中进行设置），您的前端在调用 API 时将获得完整的类型安全。无需代码生成，也无需维护 OpenAPI schema，只需 TypeScript 类型推断即可。
Elysia 还内置了使用其 `t`（TypeBox）模式构建器的请求验证功能：
```ts
import { Elysia, t } from "elysia";
new Elysia().post(
"/users",
({ body }) => {
// body is typed as { name: string, email: string }
return createUser(body);
},
{
body: t.Object({
name: t.String(),
email: t.String(),
}),
}
);
```
该模式在运行时进行验证，并在编译时提供 TypeScript 类型。一个定义即可满足这两个目的。

### 如何定义您的 API

创建 `src/server/api.ts`。所有 API 路由都放在这里：
```ts
// src/server/api.ts
import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, purchases, users } from "@/lib/db";
export const api = new Elysia({ prefix: "/api" })
.onRequest(({ request }) => {
console.log(`[API] ${request.method} ${request.url}`);
})
.onError(({ code, error, path }) => {
console.error(`[API ERROR] ${code} on ${path}:`, error);
})
.get("/health", () => ({
status: "ok",
timestamp: new Date().toISOString(),
}))
.get("/me", async ({ request, set }) => {
const session = await auth.api.getSession({
headers: request.headers,
});
if (!session) {
set.status = 401;
return { error: "Unauthorized" };
}
return { user: session.user };
})
.get("/payments/status", async ({ request, set }) => {
const session = await auth.api.getSession({
headers: request.headers,
});
if (!session) {
set.status = 401;
return { error: "Unauthorized" };
}
const purchase = await db
.select()
.from(purchases)
.where(eq(purchases.userId, session.user.id))
.limit(1);
return {
userId: session.user.id,
purchase: purchase[0] ?? null,
};
});
export type Api = typeof api;
```
最后一行至关重要。`export type Api = typeof api` 它导出 API 的完整类型签名。Eden Treaty 使用此类型在前端生成完全类型的客户端。
你很快就会明白它是如何运作的。
注意已认证端点的处理模式：调用 `auth.api.getSession()` 传入请求头，检查会话是否存在，如果不存在则返回 401 错误。这种方式简单明了，无需任何装饰器或中间件技巧。
`onRequest` 和 `onError` 钩子会为每个请求提供日志记录。在生产环境中，您需要将这些钩子替换为结构化的日志记录，并将其发送到您的可观测性平台。

### 如何在 TanStack 中开始使用 Mount Elysia

TanStack Start 使用基于文件的路由。要使用 Elysia 处理所有 API 请求，请创建一个通配符路由 `src/routes/api.$.ts`：
```javascript
// src/routes/api.$.ts
import { createFileRoute } from "@tanstack/react-router";
import { api } from "../server/api";
const handler = ({ request }: { request: Request }) => api.fetch(request);
export const Route = createFileRoute("/api/$")({
server: {
handlers: {
GET: handler,
POST: handler,
PUT: handler,
PATCH: handler,
DELETE: handler,
OPTIONS: handler,
},
},
});
```
文件名中的 `$` 是 TanStack Router 的通配符语法。此路由匹配任何以 `/api/` 开头的路径，并且该 `server.handlers` 对象会将 HTTP 方法映射到您的 Elysia 处理程序。所有指向 `/api/*` 的请求都会转发到 Elysia 的 `.fetch()` 方法。
这是关键的架构洞察：Elysia 嵌入在 TanStack Start 内部，没有单独的 API 服务器。您的 Web 应用和 API 共享同一个进程、同一个端口和同一个部署环境。
这样可以消除 CORS 问题，简化部署，并且意味着您的 API 类型可以直接在前端导入。
请访问以下链接测试您的 API `http://localhost:3000/api/health`。您应该看到：
```json
{ "status": "ok", "timestamp": "2026-03-28T12:00:00.000Z" }
```

## 如何使用 Eden Treaty 添加类型安全的 API 调用

[Eden Treaty](https://elysiajs.com/eden/treaty/overview)是 Elysia 的配套客户端库。它是一个端到端的类型安全的 HTTP 客户端，能够将 Elysia API 的路由结构镜像为一个 JavaScript 对象。`fetch("/api/users")`。您无需编写和手动输入响应，只需调用 Eden Treaty `api.api.users.get()` 即可获得完整的自动补全、参数验证和返回类型推断功能，所有这些都基于您的服务器代码在编译时自动生成，无需任何代码生成。
这就是该技术栈的独特之处。Eden Treaty 会读取从 Elysia API 导出的类型，并生成一个完全类型化的客户端。每个端点、每个参数、每个响应结构都在编译时推断出来。

### 如何设置 Eden Treaty 客户端

由于 Elysia 已嵌入到您的 TanStack Start 应用中（同源），因此您无需向 Treaty 客户端传递 URL。您可以直接从 Elysia 应用实例创建客户端用于服务器端，并使用基于 URL 的客户端用于浏览器端。
最简单的方法是创建一个辅助函数，该函数返回 Eden Treaty 客户端：
```ts
// src/lib/treaty.ts
import { treaty } from "@elysiajs/eden";
import type { Api } from "@/server/api";
// For client-side usage, connect to the same origin
export const api = treaty<Api>(
typeof window !== "undefined"
? window.location.origin
: (process.env.BETTER_AUTH_URL ?? "http://localhost:3000")
);
```
现在您可以在应用程序中的任何位置使用 `api`，并享有完整的类型安全保障：
```ts
// Calling GET /api/health
const { data } = await api.api.health.get();
// data is typed as { status: string, timestamp: string }
// Calling GET /api/me (authenticated)
const { data: me, error } = await api.api.me.get();
// data is typed as { user: { id: string, email: string, ... } }
// error is typed as { error: string } | null
```
请注意方法链是如何反映路由结构的。`/api/health` 端点变成了 `api.api.health.get()`。路径段变成了属性，而 HTTP 方法变成了最终的函数调用。
以上信息均来自 `export type Api = typeof api` 导出。

### 类型如何从服务器流向客户端

以下是类型在堆栈中流动的完整示意图：
```ts
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Drizzle Schema │ │ Elysia API │ │ Eden Treaty │
│ (schema.ts) │────▶│ (api.ts) │────▶│ (client) │
│ │ │ │ │ │
│ type User = │ │ .get("/me", │ │ api.api.me │
│ typeof users │ │ () => user) │ │ .get() │
│ .$inferSelect │ │ │ │ → { user } │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```
首先，**Drizzle**会根据你的表定义推断 TypeScript 类型。`User` 类型信息来源于 `users` 表结构。
然后，**Elysia**在路由处理程序中使用这些类型。当处理程序返回时 `{ user: session.user }`，Elysia 会捕获返回类型。
最后，**Eden Treaty**读取 `export type Api = typeof api` 导出内容并生成一个客户端，其中每个端点都具有完整的类型。
如果向表结构中添加字段到 `users`，Drizzle 的推断类型会更新。如果 Elysia 处理程序返回该新字段，Eden Treaty 的客户端类型也会更新。如果 React 组件访问了已不存在的字段，TypeScript 会在编译时捕获该错误。
零代码生成，零运行时开销，TypeScript 代码推断发挥其最大优势。

### 如何处理 Eden Treaty 中的错误

每次调用 Eden Treaty 都会返回一个 `{ data, error }` 元组。这不是抛出的异常，而是一个区分联合操作，它强制你处理成功和失败两种情况：
```javascript
const { data, error } = await api.api.me.get();
if (error) {
// error is typed based on what your Elysia handler can return
console.error("Failed to fetch user:", error);
return null;
}
// data is now narrowed to the success type
console.log(data.user.email);
```
这种模式消除了 Axios 中常见的"忘记处理错误"这类 bug `fetch`，这类 bug 会抛出错误但很容易被忽略。有了 Eden Treaty，TypeScript 编译器会提醒你。

### 如何在路由加载器中使用 Eden Treaty

TanStack Start 的起始路由包含 `loader` 函数，这些函数在服务器端渲染 (SSR) 期间在服务器端运行，在客户端导航期间运行。您可以在这些加载器中使用 Eden 协议在页面渲染之前获取数据：
```tsx
// src/routes/_authenticated/dashboard.tsx
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/treaty";
export const Route = createFileRoute("/_authenticated/dashboard")({
loader: async () => {
const { data } = await api.api.payments.status.get();
return { purchase: data?.purchase ?? null };
},
component: DashboardPage,
});
function DashboardPage() {
const { purchase } = Route.useLoaderData();
return (
<div>
<h1>Dashboard</h1>
{purchase ? (
<p>Your plan: {purchase.tier}</p>
) : (
<p>No active plan.</p>
)}
</div>
);
}
```
该 `loader` 函数在组件渲染之前运行，因此页面不会显示初始数据的加载指示器。它 `Route.useLoaderData()` 根据加载器的返回值返回完全类型化的数据。如果更改加载器的返回类型，TypeScript 会捕获组件中的类型不匹配问题。

## 如何使用 Better Auth 添加身份验证

所有 SaaS 应用都需要身份验证。在本教程中，您将使用 Better Auth 和 GitHub OAuth。Better Auth 是一个与框架无关的身份验证库，它与 Drizzle 原生兼容，并对 TanStack Start 提供一流的支持。

### 如何创建 GitHub OAuth 应用

在编写任何代码之前，请先创建一个 GitHub OAuth 应用程序：
1. 前往[GitHub 开发者设置](https://github.com/settings/developers)
2. 点击"新建 OAuth 应用"
3. 将主页网址设置为 `http://localhost:3000`
4. 将授权回调 URL 设置为 `http://localhost:3000/api/auth/callback/github`
5. 点击"注册申请"
6. 复制客户端 ID 并生成客户端密钥
将以下内容添加到项目根目录下的 `.env` 文件中：
```env

# .env

DATABASE_URL=postgres://postgres:postgres@db.localtest.me:5432/my_saas
BETTER_AUTH_SECRET=your-random-32-character-string-here
BETTER_AUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```
生成一个随机密钥 `BETTER_AUTH_SECRET`：
```bash
openssl rand -base64 32
```

### 如何配置认证服务器

创建 `src/lib/auth/index.ts`。这是服务器端身份验证配置：
```ts
// src/lib/auth/index.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import * as schema from "@/lib/db";
import { db } from "@/lib/db";
const isDev = process.env.NODE_ENV !== "production";
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
export const auth = betterAuth({
baseURL,
database: drizzleAdapter(db, {
provider: "pg",
usePlural: true,
schema: {
users: schema.users,
sessions: schema.sessions,
accounts: schema.accounts,
verifications: schema.verifications,
},
}),
socialProviders: {
github: {
clientId: process.env.GITHUB_CLIENT_ID ?? "",
clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
},
},
session: {
expiresIn: 60 * 60 * 24 * 7, // 7 days
updateAge: 60 * 60 * 24, // refresh daily
cookieCache: {
enabled: true,
maxAge: 5 * 60, // 5 minutes
},
},
trustedOrigins: isDev
? ["http://localhost:3000"]
: [baseURL],
plugins: [tanstackStartCookies()],
});
export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
```
此配置的关键细节：
* `drizzleAdapter` 将 Better Auth 连接到您的 Drizzle 数据库。该 `usePlural: true` 选项指定您的表名 `users`（而非 `user`）、`sessions`（而非 `session`），依此类推。
* `tanstackStartCookies()` 这是一个用于处理 TanStack Start 服务端渲染 (SSR) 的 cookie 管理插件。如果没有它，服务端渲染期间会话将无法正确持久化。
* `cookieCache` 将会话数据存储在 cookie 中 5 分钟，从而减少每次请求的数据库查询次数。

### 如何配置身份验证客户端

创建 `src/lib/auth/client.ts`。浏览器端身份验证客户端：
```javascript
// src/lib/auth/client.ts
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
baseURL: "",
});
export const { signIn, signOut, useSession } = authClient;
```
由于 Elysia 已嵌入到您的 TanStack Start 应用中，因此该 `baseURL` 值为空字符串。身份验证请求会发送 `/api/auth/*` 到同一源，无需单独的身份验证服务器。

### 如何挂载身份验证路由

Better Auth 需要处理请求 `/api/auth/*`。由于 Elysia 处理所有 `/api/*` 路由，因此您需要将 Better Auth 的处理程序挂载到 Elysia 内部。
在 `src/server/api.ts` 中添加：
```javascript
// In src/server/api.ts, add Better Auth's handler
export const api = new Elysia({ prefix: "/api" })
// Mount Better Auth to handle /api/auth/* routes
.mount(auth.handler)
// ... rest of your routes
```
该 `.mount(auth.handler)` 调用指示 Elysia 将所有与 Better Auth 路由匹配的请求转发给身份验证处理程序。这涵盖登录、注销、会话管理和 OAuth 回调。

### 如何保护路由

TanStack Start 使用布局路由来保护页面组。创建 `src/routes/_authenticated.tsx`：
```tsx
// src/routes/_authenticated.tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
const getCurrentUser = createServerFn().handler(async () => {
const rawHeaders = getRequestHeaders();
const headers = new Headers(rawHeaders as HeadersInit);
const session = await auth.api.getSession({ headers });
return session?.user ?? null;
});
export const Route = createFileRoute("/_authenticated")({
beforeLoad: async ({ location }) => {
const user = await getCurrentUser();
if (!user) {
throw redirect({
to: "/login",
search: { redirect: location.pathname },
});
}
return { user };
},
component: AuthenticatedLayout,
});
function AuthenticatedLayout() {
return <Outlet />;
}
```
前缀 `_authenticated`（带下划线）使之成为 TanStack Router 中的布局路由。任何嵌套在其中的路由 `src/routes/_authenticated/` 都会首先执行此 `beforeLoad` 检查。如果用户未登录，则会使用 `/login` 重定向参数将其重定向到其他页面，以便在登录后返回原始页面。
该 `createServerFn` 功能在服务器端渲染 (SSR) 期间运行。它会读取请求 cookie，检查会话是否有效，并返回用户信息。这意味着身份验证检查在服务器端进行，在将任何 HTML 发送到浏览器之前完成。
现在，您创建的任何文件 `src/routes/_authenticated/` 都会自动受到保护。例如，`src/routes/_authenticated/dashboard.tsx` 都要进行身份验证。

### 如何构建登录页面

创建登录页面 `src/routes/login.tsx`：
```tsx
// src/routes/login.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { signIn } from "@/lib/auth/client";
const searchSchema = z.object({
redirect: z.string().optional(),
});
export const Route = createFileRoute("/login")({
validateSearch: searchSchema,
component: LoginPage,
});
function LoginPage() {
const { redirect: redirectTo } = Route.useSearch();
const [isLoading, setIsLoading] = useState(false);
const handleGitHubLogin = async () => {
setIsLoading(true);
const callbackURL = redirectTo
? `${window.location.origin}${redirectTo}`
: `${window.location.origin}/dashboard`;
await signIn.social({
provider: "github",
callbackURL,
});
};
return (
<div className="flex min-h-screen items-center justify-center">
<div className="w-full max-w-md rounded-lg border p-8">
<h1 className="mb-6 text-2xl font-bold">Sign In</h1>
<button
onClick={handleGitHubLogin}
disabled={isLoading}
className="w-full rounded-md bg-gray-900 px-4 py-3 text-white"
>
{isLoading ? "Signing in..." : "Sign in with GitHub"}
</button>
</div>
</div>
);
}
```
TanStack Router 的 `validateSearch` 使用 Zod 验证查询参数。该 `redirect` 参数类型为可选字符串，并 `Route.useSearch()` 返回一个类型安全的对象。无需手动解析。

### 如何添加登录重定向中间件

您还需要将已认证用户重定向到其他页面，使其离开登录页面。请在以下位置创建入口点 `src/start.ts`：
```javascript
// src/start.ts
import { redirect } from "@tanstack/react-router";
import { createMiddleware, createStart } from "@tanstack/react-start";
import { getRequestHeaders, getRequestUrl } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
const authMiddleware = createMiddleware({ type: "request" }).server(
async ({ next }) => {
const rawHeaders = getRequestHeaders();
const headers = new Headers(rawHeaders as HeadersInit);
const url = getRequestUrl();
if (url.pathname !== "/login") {
return next();
}
const session = await auth.api.getSession({ headers });
if (session?.user) {
const redirectTo = url.searchParams.get("redirect");
throw redirect({
to: redirectTo || "/dashboard",
});
}
return next();
}
);
export const startInstance = createStart(() => ({
requestMiddleware: [authMiddleware],
}));
```
该中间件会在每个请求上运行。如果用户已通过身份验证并访问 `/login` 该页面，则会被重定向到控制面板（或他们最初想要访问的任何页面）。

## 如何构建一个完整的功能（四层模式）

现在你已经有了数据库、API、类型安全的客户端和身份验证机制，是时候构建真正的功能了。此架构中的每个功能都遵循相同的四层模式：
![Image 3: 本教程中使用的四层功能模式：第一层 Schema 定义数据结构；第二层 API 公开 CRUD 操作；第三层 Hooks 将 React 连接到 API；第四层 UI 渲染并处理用户交互。](https://cdn.hashnode.com/uploads/covers/69a694d8d4dc9b42434c218f/2e658c33-30fa-49ea-b5fc-50428d336cc4.png)

一旦你理解了这个模式，添加功能就变得轻而易举了。接下来，我们将逐步构建一个完整的购买状态功能，让已认证用户能够查看他们的购买历史记录。

### 第 1 层：模式

您 `purchases` 表之前已经在模式中定义了。供参考：
```javascript
// src/lib/db/schema.ts
export const purchases = pgTable("purchases", {
id: text("id")
.primaryKey()
.$defaultFn(() => crypto.randomUUID()),
userId: text("user_id")
.notNull()
.references(() => users.id, { onDelete: "cascade" }),
stripeCheckoutSessionId: text("stripe_checkout_session_id")
.notNull()
.unique(),
stripeCustomerId: text("stripe_customer_id"),
stripePaymentIntentId: text("stripe_payment_intent_id"),
tier: purchaseTierEnum("tier").notNull(),
status: purchaseStatusEnum("status").notNull().default("completed"),
amount: integer("amount").notNull(),
currency: text("currency").notNull().default("usd"),
purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
createdAt: timestamp("created_at").notNull().defaultNow(),
updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```
如果您要添加新功能，请从这里开始。定义表格，运行命令 `bun run db:push`，然后切换到第二层。

### 第二层：API

在以下位置创建 API 路由模块 `src/server/routes/purchases.ts`：
```javascript
// src/server/routes/purchases.ts
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { auth } from "@/lib/auth";
import { db, purchases } from "@/lib/db";
export const purchasesRoute = new Elysia({ prefix: "/purchases" })
.get("/status", async ({ request, set }) => {
const session = await auth.api.getSession({
headers: request.headers,
});
if (!session?.user) {
set.status = 401;
return { error: "Unauthorized" };
}
const purchase = await db
.select()
.from(purchases)
.where(eq(purchases.userId, session.user.id))
.limit(1);
return purchase[0] ?? null;
});
```
然后将此路由模块注册到您的主 API 文件中：
```javascript
// src/server/api.ts
import { purchasesRoute } from "./routes/purchases";
export const api = new Elysia({ prefix: "/api" })
.mount(auth.handler)
.use(purchasesRoute)
// ... other routes
```
该 `.use()` 方法会组合 Elysia 实例。每个路由模块都是一个独立的 Elysia 实例，拥有自己的前缀，并将 `use` 它们合并到主应用程序中。Eden Treaty 会识别完整的组合类型，因此您的客户端会自动了解新的端点。

### 第三层：钩子

创建一个自定义钩子，将你的 React 组件连接到 API：
```javascript
// src/hooks/use-purchase-status.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/treaty";
export function usePurchaseStatus() {
return useQuery({
queryKey: ["purchase-status"],
queryFn: async () => {
const { data, error } = await api.api.purchases.status.get();
if (error) throw new Error("Failed to fetch purchase status");
return data;
},
});
}
```
TanStack Query 处理缓存、重新获取、加载状态和错误状态。它 `queryKey` 用于识别缓存中的数据。如果多个组件调用该函数 `usePurchaseStatus()`，则只会发出一个网络请求。
对于数据变更（创建、更新或删除数据），请使用 `useMutation`：
```javascript
// src/hooks/use-checkout.ts
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/treaty";
export function useCheckout() {
return useMutation({
mutationFn: async () => {
const { data, error } = await api.api.payments.checkout.post();
if (error) throw new Error("Failed to create checkout session");
return data;
},
onSuccess: (data) => {
// Redirect to Stripe Checkout
if (data?.url) {
window.location.href = data.url;
}
},
});
}
```

### 第四层：用户界面

在 React 组件中使用 hooks：
```tsx
// src/components/purchase-status.tsx
import { usePurchaseStatus } from "@/hooks/use-purchase-status";
export function PurchaseStatus() {
const { data: purchase, isLoading, error } = usePurchaseStatus();
if (isLoading) {
return <div>Loading...</div>;
}
if (error) {
return <div>Failed to load purchase status.</div>;
}
if (!purchase) {
return (
<div className="rounded-lg border p-6">
<h2 className="text-lg font-semibold">No Active Purchase</h2>
<p className="mt-2 text-gray-600">
You have not purchased a plan yet.
</p>
</div>
);
}
return (
<div className="rounded-lg border p-6">
<h2 className="text-lg font-semibold">
{purchase.tier.charAt(0).toUpperCase() + purchase.tier.slice(1)} Plan
</h2>
<p className="mt-2 text-gray-600">
Status: {purchase.status}
</p>
<p className="text-sm text-gray-500">
Purchased on{" "}
{new Date(purchase.purchasedAt).toLocaleDateString()}
</p>
</div>
);
}
```
这就是完整的四层模式。模式定义数据。API 暴露数据。Hooks 将 React 与 API 连接起来。UI 渲染结果。你添加的每个功能都遵循这四个步骤。

### 各层是如何连接的

以下是读取操作中数据如何流经四层的完整示意图：
```text
User clicks "Dashboard"
→ TanStack Router triggers the route loader
→ Loader calls api.api.purchases.status.get() via Eden Treaty
→ Elysia receives GET /api/purchases/status
→ Handler calls auth.api.getSession() to verify the user
→ Handler queries db.select().from(purchases) via Drizzle
→ Handler returns { purchase } with inferred types
→ Eden Treaty receives typed response
→ Loader returns typed data
→ Component renders with Route.useLoaderData()
```
对于写入操作（创建新资源），流程类似，但使用 mutation：
```text
User clicks "Buy Now"
→ onClick calls checkout.mutate() from useMutation hook
→ mutationFn calls api.api.payments.checkout.post() via Eden Treaty
→ Elysia receives POST /api/payments/checkout
→ Handler creates a Stripe checkout session
→ Handler returns { url }
→ Eden Treaty receives typed response
→ onSuccess redirects to Stripe Checkout
```

### 如何添加第二个功能

为了巩固这种模式，我们来逐步演示如何添加用户配置文件更新功能。这将展示写入操作的全部四个层级。
**第一层：架构。** `users` 表中已有一个 `name` 可更新的字段。无需更改架构。
**第二层：API。**添加 `PATCH` 端点：
```javascript
// In src/server/api.ts
.patch(
"/me",
async ({ request, body, set }) => {
const session = await auth.api.getSession({
headers: request.headers,
});
if (!session) {
set.status = 401;
return { error: "Unauthorized" };
}
const [updatedUser] = await db
.update(users)
.set({
name: body.name,
updatedAt: new Date(),
})
.where(eq(users.id, session.user.id))
.returning();
return { user: updatedUser };
},
{
body: t.Object({
name: t.String({ minLength: 1, maxLength: 100 }),
}),
},
)
```
此 `body` 选项会在运行时验证请求体，并在编译时提供 TypeScript 类型。如果有人发送的请求缺少某个 `name` 字段，Elysia 会自动返回 400 错误。您无需自行编写任何验证逻辑。
**第三层：钩子。**创建一个变异钩子：
```ts
// src/hooks/use-update-profile.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/treaty";
export function useUpdateProfile() {
const queryClient = useQueryClient();
return useMutation({
mutationFn: async (data: { name: string }) => {
const { data: result, error } = await api.api.me.patch(data);
if (error) throw new Error("Failed to update profile");
return result;
},
onSuccess: () => {
// Invalidate any queries that depend on user data
queryClient.invalidateQueries({ queryKey: ["me"] });
},
});
}
```
回调函数 `onSuccess` 会使用户相关查询的缓存失效。这意味着任何显示用户数据的组件都会自动重新获取并显示更新后的名称。
**第四层：用户界面。**在表单组件中使用钩子：
```tsx
// src/components/profile-form.tsx
import { useState } from "react";
import { useUpdateProfile } from "@/hooks/use-update-profile";
export function ProfileForm({ currentName }: { currentName: string }) {
const [name, setName] = useState(currentName);
const updateProfile = useUpdateProfile();
const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
updateProfile.mutate({ name });
};
return (
<form onSubmit={handleSubmit}>
<label htmlFor="name" className="block text-sm font-medium">
Display Name
</label>
<input
id="name"
type="text"
value={name}
onChange={(e) => setName(e.target.value)}
className="mt-1 block w-full rounded-md border px-3 py-2"
/>
<button
type="submit"
disabled={updateProfile.isPending}
className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white"
>
{updateProfile.isPending ? "Saving..." : "Save"}
</button>
{updateProfile.isError && (
<p className="mt-2 text-sm text-red-600">
Failed to update profile. Please try again.
</p>
)}
</form>
);
}
```
四层结构，第二个功能。模式每次都相同。
这种模式是刻意重复的。重复是一种特性，而不是缺陷。当每个功能都遵循相同的结构时，你总能知道该从哪里入手。
新代码会出现在可预测的位置。如果您使用 AI 编码助手，它可以从您的代码库中学习这种模式，并为新功能生成所有四个层。

## 如何使用 Stripe 添加付款

大多数 SaaS 应用都需要收款。您将使用 Stripe Checkout 集成 Stripe 来处理一次性购买。关键的架构决策是使用后台作业可靠地处理 Webhook，您将在下一节中添加后台作业。

### 如何设置 Stripe

创建 `src/lib/payments/index.ts`：
```ts
// src/lib/payments/index.ts
import Stripe from "stripe";
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
if (!stripeClient) {
const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
throw new Error(
"STRIPE_SECRET_KEY is not set. Payment functionality is unavailable."
);
}
stripeClient = new Stripe(secretKey);
}
return stripeClient;
}
// Lazy-initialized proxy so imports don't crash without env vars
export const stripe = new Proxy({} as Stripe, {
get(_, prop) {
return Reflect.get(getStripe(), prop);
},
});
export async function createOneTimeCheckoutSession(params: {
priceId: string;
successUrl: string;
cancelUrl: string;
metadata: Record<string, string>;
customerEmail?: string;
couponId?: string;
}) {
const client = getStripe();
const session = await client.checkout.sessions.create({
mode: "payment",
line_items: [{ price: params.priceId, quantity: 1 }],
success_url: params.successUrl,
cancel_url: params.cancelUrl,
metadata: params.metadata,
...(params.customerEmail && {
customer_email: params.customerEmail,
}),
...(params.couponId
? { discounts: [{ coupon: params.couponId }] }
: { allow_promotion_codes: true }),
});
return session;
}
export async function retrieveCheckoutSession(sessionId: string) {
const client = getStripe();
return client.checkout.sessions.retrieve(sessionId);
}
export async function constructWebhookEvent(
payload: string | Buffer,
signature: string
) {
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}
const client = getStripe();
return client.webhooks.constructEventAsync(payload, signature, webhookSecret);
}
```
Stripe 客户端的这种 `Proxy` 模式是一种生产级技术。它会延迟初始化 Stripe SDK，这样即使 `STRIPE_SECRET_KEY` 缺少环境变量，你的模块也能顺利导入而不会崩溃。这在构建过程中以及并非所有服务都已配置的环境中非常有用。

### 如何创建结账端点

在您的 API 中添加结账端点：
```javascript
// In src/server/api.ts
.post("/payments/checkout", async ({ set }) => {
const priceId = process.env.STRIPE_PRO_PRICE_ID;
if (!priceId) {
set.status = 500;
return { error: "Price not configured" };
}
const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const checkoutSession = await createOneTimeCheckoutSession({
priceId,
successUrl: `${baseUrl}/dashboard?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
cancelUrl: `${baseUrl}/pricing`,
metadata: { tier: "pro" },
});
return { url: checkoutSession.url };
})
```
该 `{CHECKOUT_SESSION_ID}` 占位符是 Stripe 模板变量。当用户被重定向回您的应用时，Stripe 会将其替换为实际的会话 ID。

### 如何处理 Webhook

Stripe 会在支付处理完毕时发送 webhook 事件。您的 webhook 处理程序需要验证签名、解析事件并进行处理。
这里有一个关键的设计决策：不要在 webhook 处理程序中进行繁重的处理。Stripe 希望在几秒钟内收到响应。如果你的处理程序耗时过长，Stripe 会重试 webhook，这可能会导致重复处理。
请改用"webhook 接收，后台作业处理"模式：
```ts
// In src/server/api.ts
.post("/payments/webhook", async ({ request, set }) => {
const body = await request.text();
const sig = request.headers.get("stripe-signature");
if (!sig) {
set.status = 400;
return { error: "Missing signature" };
}
try {
const event = await constructWebhookEvent(body, sig);
console.log(`[Webhook] Received ${event.type}`);
if (event.type === "charge.refunded") {
const charge = event.data.object as {
id: string;
payment_intent: string;
amount: number;
amount_refunded: number;
currency: string;
};
await inngest.send({
name: "stripe/charge.refunded",
data: {
chargeId: charge.id,
paymentIntentId: charge.payment_intent,
amountRefunded: charge.amount_refunded,
originalAmount: charge.amount,
currency: charge.currency,
},
});
}
return { received: true };
} catch (error) {
console.error("[Webhook] Stripe verification failed:", error);
set.status = 400;
return { error: "Webhook verification failed" };
}
})
```
Webhook 处理程序执行三项操作：验证签名、识别事件类型，并将数据转发给 Inngest 进行后台处理。它会立即返回响应 `{ received: true }`。实际的业务逻辑（发送电子邮件、授予访问权限、更新记录）在后台作业中执行，您将在下一步构建该作业。

### 如何在前端领取购买商品

成功结账后，Stripe 会将用户重定向回您的应用，并附带一个会话 ID。您需要一个接口来验证会话并创建数据库记录，从而确认此次购买：
```javascript
// In src/server/api.ts
.post(
"/purchases/claim",
async ({ body, request, set }) => {
const session = await auth.api.getSession({
headers: request.headers,
});
if (!session) {
set.status = 401;
return { error: "Unauthorized" };
}
const { sessionId } = body;
// Check if already claimed (idempotency)
const existing = await db
.select()
.from(purchases)
.where(eq(purchases.stripeCheckoutSessionId, sessionId))
.limit(1);
if (existing[0]) {
return { success: true, alreadyClaimed: true, tier: existing[0].tier };
}
// Verify payment with Stripe
const stripeSession = await retrieveCheckoutSession(sessionId);
if (stripeSession.payment_status !== "paid") {
set.status = 400;
return { error: "Payment not completed" };
}
const tier = (stripeSession.metadata?.tier ?? "pro") as "pro";
// Create purchase record
await db.insert(purchases).values({
userId: session.user.id,
stripeCheckoutSessionId: sessionId,
stripeCustomerId:
typeof stripeSession.customer === "string"
? stripeSession.customer
: stripeSession.customer?.id ?? null,
stripePaymentIntentId:
typeof stripeSession.payment_intent === "string"
? stripeSession.payment_intent
: stripeSession.payment_intent?.id ?? null,
tier,
status: "completed",
amount: stripeSession.amount_total ?? 0,
currency: stripeSession.currency ?? "usd",
});
// Trigger background processing
await inngest.send({
name: "purchase/completed",
data: {
userId: session.user.id,
tier,
sessionId,
},
});
return { success: true, tier };
},
{
body: t.Object({
sessionId: t.String(),
}),
}
)
```
请注意顶部的幂等性检查。如果用户刷新成功页面或前端重试索赔请求，则端点将返回现有购买记录，而不是创建重复记录。
这对于支付流程至关重要。您绝不希望意外地向某人收取两次费用或创建重复记录。
该 `inngest.send()` 调用会触发购买流程的后台处理。您可以在后台发送确认邮件、授予资源访问权限、跟踪分析事件以及执行任何其他购买后工作。

### 如何进行本地支付测试

安装 Stripe CLI 并将 webhook 转发到您的本地服务器：
```text

# Install Stripe CLI (macOS)

brew install stripe/stripe-cli/stripe

# Login to Stripe

stripe login

# Forward webhooks to your local server

stripe listen --forward-to localhost:3000/api/payments/webhook
```
Stripe CLI 会提供一个以 `whsec_` 开头的 webhook 签名密钥。将其添加到您的 `.env`：
```text
STRIPE_WEBHOOK_SECRET=whsec_your-local-webhook-secret
```
在 Stripe 控制面板中创建一个测试产品和价格（或使用 Stripe CLI），然后将价格 ID 添加到您的 `.env`：
```text
STRIPE_SECRET_KEY=sk_test_your-test-secret-key
STRIPE_PRO_PRICE_ID=price_your-test-price-id
```

## 如何使用 Inngest 添加后台作业

后台任务对于任何 SaaS 服务都至关重要。您可以使用它们来处理 Webhook、发送电子邮件、授予资源访问权限以及任何不应阻塞 API 响应的任务。Inngest 提供持久化、可重试的函数，并内置检查点机制。

### 为什么后台工作很重要

想想当有人购买你的SaaS产品时会发生什么：
1. 使用 Stripe 验证付款
2. 在数据库中创建购买记录
3. 向客户发送确认邮件
4. 向管理员发送通知邮件
5. 授予对私有 GitHub 存储库的访问权限
6. 在您的分析平台中跟踪购买事件
7. 安排后续邮件序列
如果尝试在 API 端点内执行所有这些操作，可能会出现多种问题。例如，电子邮件服务可能中断，GitHub API 可能限制了您的调用速率，或者您的分析调用可能超时。
任何失败都意味着用户会看到错误信息，你需要弄清楚哪些步骤已完成，哪些步骤未完成。
Inngest 通过持久执行解决了这个问题。每个步骤都有检查点。如果步骤 3 失败，Inngest 会重试步骤 3，而不会重新运行步骤 1 和 2。
如果整个函数运行失败，Inngest 会重试整个过程。这样可以确保至少执行一次，并自动进行去重。

### 如何设置 Inngest

创建 Inngest 客户端 `src/lib/jobs/client.ts`：
```javascript
// src/lib/jobs/client.ts
import { Inngest } from "inngest";
export const inngest = new Inngest({
id: "my-saas",
});
```

### 如何编写你的第一个 Inngest 函数

创建 `src/lib/jobs/functions/stripe.ts`，使用购买完成处理程序：
```ts
// src/lib/jobs/functions/stripe.ts
import { eq } from "drizzle-orm";
import { inngest } from "../client";
import { db, purchases, users } from "@/lib/db";
export const handlePurchaseCompleted = inngest.createFunction(
{
id: "purchase-completed",
triggers: [{ event: "purchase/completed" }],
},
async ({ event, step }) => {
const { userId, tier, sessionId } = event.data as {
userId: string;
tier: string;
sessionId: string;
};
// Step 1: Look up user and purchase details
const { user, purchase } = await step.run(
"lookup-user-and-purchase",
async () => {
const userResult = await db
.select({
id: users.id,
email: users.email,
name: users.name,
})
.from(users)
.where(eq(users.id, userId))
.limit(1);
const foundUser = userResult[0];
if (!foundUser) {
throw new Error(`User not found: ${userId}`);
}
const purchaseResult = await db
.select({
amount: purchases.amount,
currency: purchases.currency,
})
.from(purchases)
.where(eq(purchases.stripeCheckoutSessionId, sessionId))
.limit(1);
return {
user: foundUser,
purchase: purchaseResult[0] ?? {
amount: 0,
currency: "usd",
},
};
}
);
// Step 2: Send purchase confirmation email
await step.run("send-purchase-confirmation", async () => {
// Send email using your email service (Resend, SendGrid, and so on)
console.log(`Sending purchase confirmation to ${user.email}`);
// await sendEmail({
// to: user.email,
// subject: "Your purchase is confirmed!",
// template: PurchaseConfirmationEmail,
// });
});
// Step 3: Send admin notification
await step.run("send-admin-notification", async () => {
const adminEmail = process.env.ADMIN_EMAIL;
if (!adminEmail) return;
console.log(`Notifying admin about purchase from ${user.email}`);
// await sendEmail({
// to: adminEmail,
// subject: `New sale: ${user.email}`,
// template: AdminNotificationEmail,
// });
});
// Step 4: Update purchase record
await step.run("update-purchase-record", async () => {
await db
.update(purchases)
.set({ updatedAt: new Date() })
.where(eq(purchases.stripeCheckoutSessionId, sessionId));
});
return { success: true, userId, tier };
}
);
export const stripeFunctions = [handlePurchaseCompleted];
```
每个步骤 `step.run()` 都是一个检查点。如果函数在步骤 2 之后失败，Inngest 会从步骤 3 重试，而不是从头开始。已完成步骤的结果会被缓存。

### 如何注册您的函数

创建一个索引文件，用于收集所有函数：
```javascript
// src/lib/jobs/functions/index.ts
import { stripeFunctions } from "./stripe";
export const functions = [...stripeFunctions];
```
还有一个导出文件：
```javascript
// src/lib/jobs/index.ts
export { inngest } from "./client";
export { functions } from "./functions";
```

### 如何将 Inngest 连接到您的 API

在 Elysia API 中挂载 Inngest 处理程序。在 `src/server/api.ts` 中添加以下内容：
```javascript
// src/server/api.ts
import { serve } from "inngest/bun";
import { inngest, functions } from "@/lib/jobs";
const inngestHandler = serve({
client: inngest,
functions,
});
export const api = new Elysia({ prefix: "/api" })
// Inngest endpoint - handles function registration and execution
.all("/inngest", async (ctx) => {
return inngestHandler(ctx.request);
})
// ... rest of your routes
```
该 `.all("/inngest")` 路由处理来自 Inngest 的 GET（用于函数注册）和 POST（用于函数执行）请求。

### 如何本地运行 Inngest

Inngest 提供了一个本地运行的开发服务器，并提供一个用于监控函数的仪表板：
```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest --no-discovery
```
这将启动 Inngest 开发服务器 `http://localhost:8288`。在浏览器中打开该 URL，即可查看显示已注册函数、事件历史记录和函数执行日志的仪表板。
该 `-u` 标志位会告诉 Inngest 您的应用运行在何处。该 `--no-discovery` 标志位会禁用自动应用发现功能，这对于本地开发来说更加可靠。
将此作为脚本添加到 `package.json`：
```json
{
"scripts": {
"inngest:dev": "npx inngest-cli@latest dev -u http://localhost:3000/api/inngest --no-discovery"
}
}
```
现在您可以通过 API 发送事件来触发您的函数：
```text
await inngest.send({
name: "purchase/completed",
data: {
userId: "user_123",
tier: "pro",
sessionId: "cs_test_abc",
},
});
```
事件会显示在 Inngest 控制面板中，该函数会逐步执行，您可以查看每个步骤的输出。如果某个步骤失败，您可以从控制面板手动重试。

### 如何处理后台作业中的退款

以下是一个更复杂的例子，它说明了持久执行的重要性。在处理退款时，您需要更新购买状态、撤销访问权限、发送通知并跟踪分析数据。即使其中任何一个步骤失败，其他步骤也应该能够继续完成：
```ts
// src/lib/jobs/functions/stripe.ts
export const handleRefund = inngest.createFunction(
{
id: "refund-processed",
triggers: [{ event: "stripe/charge.refunded" }],
},
async ({ event, step }) => {
const { paymentIntentId, amountRefunded, originalAmount, currency } =
event.data as {
chargeId: string;
paymentIntentId: string;
amountRefunded: number;
originalAmount: number;
currency: string;
};
const isFullRefund = amountRefunded >= originalAmount;
// Step 1: Find the purchase and user
const { user, purchase } = await step.run(
"lookup-purchase",
async () => {
const purchaseResult = await db
.select()
.from(purchases)
.where(eq(purchases.stripePaymentIntentId, paymentIntentId))
.limit(1);
if (!purchaseResult[0]) {
return { user: null, purchase: null };
}
const userResult = await db
.select()
.from(users)
.where(eq(users.id, purchaseResult[0].userId))
.limit(1);
return {
user: userResult[0] ?? null,
purchase: purchaseResult[0],
};
}
);
if (!purchase || !user) {
return { success: false, reason: "no_matching_purchase" };
}
// Step 2: Update purchase status
await step.run("update-purchase-status", async () => {
await db
.update(purchases)
.set({
status: isFullRefund ? "refunded" : "partially_refunded",
updatedAt: new Date(),
})
.where(eq(purchases.id, purchase.id));
});
// Step 3: Send customer notification
await step.run("notify-customer", async () => {
console.log(`Sending ${isFullRefund ? "full" : "partial"} refund notification to ${user.email}`);
// await sendEmail({ ... });
});
return { success: true, isFullRefund };
}
);
```
即使在步骤 3 中电子邮件服务中断，步骤 2（更新数据库）也已完成，不会重新运行。Inngest 只会重试失败的步骤。
这就是持久执行对支付处理的价值所在。您无需构建自己的重试逻辑，即可获得可靠且幂等的处理。

## 如何使用 Neon 部署到 Vercel

现在您已经拥有一个具备身份验证、数据库、类型安全的 API、支付和后台任务等功能的应用程序。是时候部署它了。

### 如何配置 Neon 数据库

1. 在 [neon.tech](https://neon.tech/) 注册并创建一个新项目
2. 选择离用户较近的区域（Neon 支持多个 AWS 区域）
3. 从控制面板复制连接字符串。
连接字符串如下所示：
```text
postgresql://username:password@ep-something.us-east-1.aws.neon.tech/my_saas?sslmode=require
```

### 如何在生产环境中运行迁移

对于生产环境，您应该使用版本化迁移，而不是使用默认迁移 `db:push`。请根据您的模式生成迁移：
```bash
bun run db:generate
```
这会在 `drizzle/` 目录中创建 SQL 文件。请检查生成的 SQL 文件，确保其符合预期。然后应用迁移：
```bash
DATABASE_URL="your-neon-connection-string" bun run db:migrate
```

### 如何部署到 Vercel

1. 将你的代码推送到 GitHub 仓库
2. 请访问 [vercel.com/new](https://vercel.com/new) 并导入您的存储库
3. Vercel 将自动检测 TanStack Start 并配置构建设置
在 Vercel 的控制面板中设置以下环境变量：
| 变量 | 值 |
| --- | --- |
| DATABASE_URL | 你的 Neon 连接字符串 |
| BETTER_AUTH_SECRET | 你随机生成的 32 个字符以上的字符串 |
| BETTER_AUTH_URL | https://your-app.vercel.app |
| GITHUB_CLIENT_ID | 您的 GitHub OAuth 客户端 ID |
| GITHUB_CLIENT_SECRET | 您的 GitHub OAuth 客户端密钥 |
| STRIPE_SECRET_KEY | 您的 Stripe 私钥（实时） |
| STRIPE_WEBHOOK_SECRET | 您的 Stripe webhook 密钥（生产环境） |
| STRIPE_PRO_PRICE_ID | 您的 Stripe 价格 ID |
点击"部署"。Vercel 会构建您的应用并将其部署到指定的 `*.vercel.app` URL。

### 如何更新 OAuth 回调函数

部署完成后，请更新 GitHub OAuth 应用的回调 URL：
1. 前往您的 GitHub OAuth 应用设置
2. **将授权回调 URL**更改为 `https://your-app.vercel.app/api/auth/callback/github`
3. 添加 `https://your-app.vercel.app` 为**首页网址**

### 如何配置用于生产环境的 Stripe Webhook

在 Stripe 控制面板中创建 webhook 端点：
1. 前往 [Stripe 控制面板 > 开发者 > Webhooks](https://dashboard.stripe.com/webhooks)
2. 点击"添加端点"
3. 将 URL 设置为 `https://your-app.vercel.app/api/payments/webhook`
4. 选择您想要接收的事件（例如 `charge.refunded`、`checkout.session.expired` 等等）
5. 复制 webhook 签名密钥并将其添加到 Vercel 的环境变量中。

### 如何在生产环境中设置 Inngest

Inngest 提供云服务，用于处理生产环境中的函数执行：
1. 请访问 [inngest.com](https://www.inngest.com/) 注册
2. 创建一个应用，并复制你的事件密钥和签名密钥。
3. 添加 `INNGEST_EVENT_KEY` 和 `INNGEST_SIGNING_KEY` 到 Vercel 的环境变量中
4. 在 Inngest 的控制面板中，将您的应用 URL 设置为 `https://your-app.vercel.app/api/inngest`
Inngest 会自动发现您的函数并开始处理事件。

### 常见部署陷阱

**1\. SSR 外部库。**某些软件包与 Vite 的 SSR 打包功能不兼容。如果在构建过程中遇到类似软件包的错误，请将其添加到 `vite.config.ts` 的以下数组中：
```javascript
// vite.config.ts
export default defineConfig({
ssr: {
external: ["elysia", "inngest"],
},
// ...
});
```
**2\. 环境变量访问。**在 TanStack Start 中，服务器端代码可以 `process.env` 直接访问环境变量。客户端代码只能访问以 `VITE_` 为前缀的变量。您的 Stripe 密钥和数据库 URL 不应带有 `VITE_` 前缀。
**3\. Neon 连接池。**在生产环境中，请使用 Neon 提供的连接池字符串（它使用端口 5432 而不是端口 5433 上的直接连接）。连接池能够更好地处理并发请求。
**4\. 构建失败。**如果构建失败，最常见的原因是 TypeScript 错误。请在推送之前先在本地运行 `bun run type-check`。在部署之前修复所有错误。
**5\. 缺少环境变量。**如果您的应用在部署后立即崩溃，请检查 Vercel 函数日志。最常见的问题是缺少环境变量。Neon 连接字符串、Stripe 密钥和 Better Auth 密钥都需要在首次部署前设置。

### 如何设置自定义域名

应用部署到 Vercel 后：
1. 在 Vercel 中，前往项目设置。
2. 点击"域名"
3. 添加您的自定义域名
4. 按照指示更新您的 DNS 记录（通常是指向的 CNAME 记录 `cname.vercel-dns.com`）。
添加自定义域名后，请在 Vercel 中更新以下环境变量：
* 设置 `BETTER_AUTH_URL` 为 `https://yourdomain.com`
* 更新您的 GitHub OAuth 应用的回调 URL 为 `https://yourdomain.com/api/auth/callback/github`
* 更新您的 Stripe webhook 端点为 `https://yourdomain.com/api/payments/webhook`
Vercel 会自动为您的自定义域名配置 SSL 证书，无需额外配置。

### 如何验证您的部署

部署完成后，请按照以下清单进行检查：
1. **健康检查。**访问 `https://yourdomain.com/api/health`。您应该会看到一个包含以下内容的 JSON 响应 `{ "status": "ok" }`。
2. **身份验证。**点击"使用 GitHub 登录"并完成 OAuth 流程。您将被重定向到您的控制面板。
3. **数据库。**登录后，请查看您的 Neon 控制面板。您应该会在 `users` 表格中看到新增的一行。
4. **付款。**在您的定价页面上，点击"购买"，并使用 Stripe 的测试卡（`4242 4242 4242 4242`）完成购买。检查数据库中是否出现购买记录。
5. **后台任务。**测试购买完成后，请查看 Inngest 控制面板。您应该会看到一个 `purchase/completed` 事件以及相应的函数执行情况。
如果上述任何步骤失败，请检查 Vercel 函数日志（设置、函数、日志）中的错误消息。大多数部署问题都是由于环境变量配置错误或缺少 Webhook 密钥造成的。

## 结论

您刚刚构建了一个可用于生产环境的 SaaS 应用。让我们回顾一下您目前拥有的功能：
* **TanStack Start**处理服务器端渲染、基于文件的路由和开发服务器。
* **Elysia**提供了一个类型安全的 API，它嵌入在与您的 Web 应用程序相同的进程中。
* **Eden Treaty**为您提供了一个完全类型化的 API 客户端，无需任何代码生成。
* **Drizzle ORM 与 Neon**结合使用，通过类型安全的查询和无服务器 PostgreSQL 来管理您的数据库。
* **Better Auth**为 GitHub OAuth 提供会话管理和路由保护功能。
* **Stripe**通过 webhook 处理支付
* **Inngest**运行可靠的后台作业，具有自动重试和检查点功能。
* **Vercel**托管所有服务，无需任何基础设施管理。
四层模式（Schema、API、Hooks、UI）为你提供了一个可重复的新功能添加流程。每个功能都遵循相同的结构：定义数据，通过 API 公开数据，使用 Hooks 将其连接到 React，并在组件中渲染数据。
这种架构具有良好的可扩展性。层与层之间明确的边界意味着您可以替换单个组件而无需重写整个架构。
如果 Neon 无法满足您的需求，请切换到自托管的 PostgreSQL。如果需要其他支付服务提供商，请替换 Stripe 模块。应用程序的其余部分保持不变。
接下来你想构建什么，完全取决于你。以下是一些自然而然的后续步骤：
* 使用 [Resend](https://resend.com/)和 [React Email](https://react.email/) 进行交易邮件（购买确认、密码重置、欢迎邮件）的**电子邮件通知**
* 使用 [PostHog](https://posthog.com/) **进行分析**，以跟踪用户行为和功能标志
* 使用 [Sentry](https://sentry.io/) **进行错误跟踪**，以便在用户报告之前捕获生产错误。
* 使用 MDX 进行博客或文档部分的**内容管理**
* 使用与 S3 兼容的存储方式上传用户生成的内容
这种 `src/lib/` 模式让添加新的集成变得非常简单。创建一个新目录，添加一个文件 `index.ts`，然后将其导入到所需位置即可。每个集成都是独立的，因此添加分析功能不会影响您的支付代码。
如果您想跳过设置步骤，立即开始构建产品，[Eden Stack](https://eden-stack.com/?utm_source=freecodecamp&utm_medium=article&utm_campaign=fullstack-saas-handbook) 包含了本文中的所有内容（以及更多），并且已经过预配置和生产环境测试。它内置了 30 多个 Claude Code 技能，这些技能编码了本文所述的模式，因此 AI 编码助手可以开箱即用地按照您的代码库规范生成功能。
无论你开发什么，都要确保类型安全。"修改模式，发现错误，修复错误"这种反馈循环是我所知的交付可靠软件最快的方法。
*Magnus Rodseth 构建 AI 原生应用程序，并且是* [*Eden Stack*](https://eden-stack.com/?utm_source=freecodecamp&utm_medium=article&utm_campaign=fullstack-saas-handbook) *的创建者，Eden Stack 是一个生产就绪的入门套件，包含 30 多个 Claude 技能，用于编码 AI 原生 SaaS 开发的生产模式。*
* * *
* * *
免费学习编程。freeCodeCamp 的开源课程已帮助超过 4 万人找到开发人员的工作。[开始使用](https://www.freecodecamp.org/learn)
