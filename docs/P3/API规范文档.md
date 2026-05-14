# Phase 3 - API 规范文档

> Violet 校园恋爱辅助平台 RESTful API 规范
>
> Base URL: `/api` (生产环境) | `http://localhost:3000` (开发环境)
>
> 认证方式：JWT + HttpOnly Cookie（`token` 字段）

---

## 通用响应格式

### 成功响应

```json
{
  // 具体业务数据，各接口单独定义
}
```

### 错误响应

```json
{
  "statusCode": 400,
  "message": "错误描述",
  "error": "Bad Request"
}
```

### 通用错误码

| HTTP 状态码 | 含义 | 场景 |
|------------|------|------|
| 400 | Bad Request | 参数校验失败、业务逻辑错误 |
| 401 | Unauthorized | 未认证或 token 过期 |
| 403 | Forbidden | 权限不足（如信用分不够、非管理员） |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如重复注册、重复申请） |
| 500 | Internal Server Error | 服务器内部错误 |

---

## 一、认证模块 `/auth`

### 1.1 用户注册

- **URL**: `POST /auth/register`
- **认证**: 无需认证

**请求参数 (Body JSON)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 南大 smail 邮箱（@smail.nju.edu.cn） |
| nickname | string | 是 | 昵称 |
| password | string | 是 | 密码 |

**成功响应 (201)**:

```json
{
  "user": {
    "id": "clxxx...",
    "email": "test@smail.nju.edu.cn",
    "nickname": "Violet",
    "creditScore": 20,
    "roles": ["CLIENT"],
    "isActive": true
  }
}
```

> 同时通过 Set-Cookie 设置 HttpOnly 的 `token` Cookie（有效期 7 天）

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 400 | 仅支持南大 smail 邮箱注册 | 邮箱后缀不符合要求 |
| 409 | 该邮箱已注册 | 邮箱重复 |

---

### 1.2 用户登录

- **URL**: `POST /auth/login`
- **认证**: 无需认证

**请求参数 (Body JSON)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱 |
| password | string | 是 | 密码 |

**成功响应 (200)**:

```json
{
  "user": {
    "id": "clxxx...",
    "email": "test@smail.nju.edu.cn",
    "nickname": "Violet",
    "creditScore": 20,
    "roles": ["CLIENT"]
  }
}
```

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 401 | 邮箱或密码错误 | 邮箱不存在或密码不匹配 |

---

### 1.3 退出登录

- **URL**: `POST /auth/logout`
- **认证**: 需要认证

**请求参数**: 无

**成功响应 (200)**:

```json
{
  "message": "已退出登录"
}
```

> 同时清除 `token` Cookie

---

### 1.4 获取当前用户信息

- **URL**: `POST /auth/me`
- **认证**: 需要认证

**请求参数**: 无

**成功响应 (200)**:

```json
{
  "id": "clxxx...",
  "email": "test@smail.nju.edu.cn",
  "nickname": "Violet",
  "avatar": "/uploads/avatars/xxx.jpg",
  "creditScore": 23,
  "roles": ["CLIENT", "WINGMAN"],
  "isActive": true
}
```

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 401 | Unauthorized | Cookie 中无有效 token |

---

## 二、用户模块 `/user`

> 本模块所有接口均需要 JWT 认证

### 2.1 获取个人资料

- **URL**: `GET /user/profile`
- **认证**: 需要认证

**成功响应 (200)**:

```json
{
  "id": "clxxx...",
  "email": "test@smail.nju.edu.cn",
  "contactEmail": "test@gmail.com",
  "nickname": "Violet",
  "avatar": "/uploads/avatars/xxx.jpg",
  "gender": "女",
  "campus": "仙林",
  "grade": "大三",
  "major": "计算机科学",
  "interests": ["摄影", "音乐"],
  "declaration": "寻找有趣的灵魂",
  "cardImage": "/uploads/cards/xxx.jpg",
  "creditScore": 23,
  "roles": ["CLIENT"],
  "wingmanCertStatus": "NONE",
  "wechat": "xxx",
  "qq": "xxx",
  "isActive": true,
  "lastActiveAt": "2026-05-14T10:00:00.000Z",
  "createdAt": "2026-03-01T08:00:00.000Z",
  "updatedAt": "2026-05-14T10:00:00.000Z"
}
```

---

### 2.2 获取其他用户公开资料

- **URL**: `GET /user/:id`
- **认证**: 需要认证

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 目标用户ID |

**成功响应 (200)**:

```json
{
  "id": "clxxx...",
  "nickname": "Violet",
  "avatar": "/uploads/avatars/xxx.jpg"
}
```

---

### 2.3 更新个人资料

- **URL**: `PATCH /user/profile`
- **认证**: 需要认证

**请求参数 (Body JSON)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | 否 | 昵称 |
| avatar | string | 否 | 头像URL |
| declaration | string | 否 | 恋爱宣言 |
| interests | string[] | 否 | 兴趣标签（最多10个） |
| campus | string | 否 | 校区 |
| grade | string | 否 | 年级 |
| major | string | 否 | 专业 |
| wechat | string | 否 | 微信 |
| qq | string | 否 | QQ |
| phone | string | 否 | 手机号 |

**成功响应 (200)**:

```json
{
  "id": "clxxx...",
  "nickname": "新昵称",
  "campus": "鼓楼",
  // ... 其他用户字段（不含 password）
}
```

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 400 | 兴趣标签不能超过10个 | interests 超出限制 |

---

### 2.4 上传头像

- **URL**: `POST /user/avatar`
- **认证**: 需要认证
- **Content-Type**: `multipart/form-data`

**请求参数 (Form Data)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| avatar | File | 是 | 图片文件，最大 2MB |

**成功响应 (201)**:

```json
{
  "id": "clxxx...",
  "avatar": "/uploads/avatars/xxx.jpg"
  // ... 其他用户字段
}
```

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 400 | 只能上传图片文件 | 文件类型不是图片 |
| 400 | 请选择图片文件 | 未选择文件 |

---

### 2.5 上传个性卡片图片

- **URL**: `POST /user/card-image`
- **认证**: 需要认证
- **Content-Type**: `multipart/form-data`

**请求参数 (Form Data)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cardImage | File | 是 | 图片文件，最大 5MB |

**成功响应 (201)**:

```json
{
  "id": "clxxx...",
  "cardImage": "/uploads/cards/xxx.jpg"
  // ... 其他用户字段
}
```

---

### 2.6 删除个性卡片图片

- **URL**: `DELETE /user/card-image`
- **认证**: 需要认证

**成功响应 (200)**:

```json
{
  "id": "clxxx...",
  "cardImage": null
  // ... 其他用户字段
}
```

---

### 2.7 军师认证

- **URL**: `POST /user/wingman-certify`
- **认证**: 需要认证

**请求参数 (Body JSON)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| moralAnswers | number[] | 是 | 道德题答案（全 > 0 即通过） |
| characteristicAnswers | string[] | 是 | 性格特征答案 |

**成功响应 (201)**:

```json
{
  "id": "clxxx...",
  "roles": ["CLIENT", "WINGMAN"],
  "wingmanCertStatus": "APPROVED"
  // ... 其他用户字段
}
```

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 400 | 道德评判未通过，请 24 小时后重新申请 | 道德题未通过 |
| 403 | 信用分需大于 10 才可申请军师认证 | 信用分不足 |
| 403 | 冷却期尚未结束，请稍后再试 | 24h 冷却中 |

---

### 2.8 修改密码

- **URL**: `PATCH /user/password`
- **认证**: 需要认证

**请求参数 (Body JSON)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| currentPassword | string | 是 | 当前密码 |
| newPassword | string | 是 | 新密码 |

**成功响应 (200)**:

```json
{
  "success": true
}
```

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 401 | 当前密码错误 | 当前密码不匹配 |

---

### 2.9 修改常用邮箱

- **URL**: `PATCH /user/contact-email`
- **认证**: 需要认证

**请求参数 (Body JSON)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| newEmail | string | 是 | 新的常用邮箱 |

**成功响应 (200)**:

```json
{
  "id": "clxxx...",
  "contactEmail": "new@example.com"
  // ... 其他用户字段
}
```

---

## 三、发现模块 `/discovery`

> 本模块所有接口均需要 JWT 认证

### 3.1 浏览用户列表

- **URL**: `GET /discovery/users`
- **认证**: 需要认证

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |

**成功响应 (200)**:

```json
{
  "users": [
    {
      "id": "clxxx...",
      "gender": "女",
      "campus": "仙林",
      "grade": "大三",
      "interests": ["摄影", "音乐"],
      "declaration": "寻找有趣的灵魂",
      "isActive": true,
      "lastActiveAt": "2026-05-14T10:00:00.000Z",
      "avatar": "/uploads/avatars/xxx.jpg",
      "cardImage": "/uploads/cards/xxx.jpg"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

> 只返回最近 7 天活跃的用户，不含当前用户自身。cardImage 为空时返回基于用户ID哈希的默认卡片。

---

### 3.2 获取关系列表

- **URL**: `GET /discovery/relationships`
- **认证**: 需要认证

**成功响应 (200)**:

```json
[
  {
    "id": "clxxx...",
    "status": "ICEBREAKING",
    "role": "client",
    "createdAt": "2026-05-10T08:00:00.000Z",
    "otherUser": {
      "id": "clyyy...",
      "nickname": "Alice",
      "avatar": "/uploads/avatars/yyy.jpg"
    },
    "myWingman": {
      "id": "clzzz...",
      "nickname": "Bob",
      "mode": "PRIVATE"
    },
    "otherWingman": null
  }
]
```

> 返回当前用户作为当事人或军师的所有活跃关系（已结束的关系不返回）。

---

### 3.3 发送牵线请求

- **URL**: `POST /discovery/match-request`
- **认证**: 需要认证

**请求参数 (Body JSON)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| toUserId | string | 是 | 目标用户ID |

**成功响应 (201)**:

```json
{
  "id": "clxxx...",
  "fromUserId": "clyyy...",
  "toUserId": "clzzz...",
  "status": "PENDING",
  "createdAt": "2026-05-14T10:00:00.000Z"
}
```

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 400 | 不能向自己发起牵线 | 目标是自己 |
| 403 | 信用分不足 | 信用分 < 5 |
| 409 | 已存在待处理的牵线请求 | 双方间有待处理请求 |
| 409 | 两人之间已存在活跃关系 | 双方间有活跃关系 |

> 消耗 5 信用分。同时自动过期发送方之前超过 24h 的待处理请求。

---

### 3.4 获取已发送的牵线请求

- **URL**: `GET /discovery/match-requests/sent`
- **认证**: 需要认证

**成功响应 (200)**:

```json
[
  {
    "id": "clxxx...",
    "fromUserId": "clyyy...",
    "toUserId": "clzzz...",
    "status": "PENDING",
    "createdAt": "2026-05-14T10:00:00.000Z",
    "toUser": {
      "id": "clzzz...",
      "gender": "女",
      "campus": "仙林",
      "interests": ["摄影"]
    }
  }
]
```

---

### 3.5 获取收到的牵线请求

- **URL**: `GET /discovery/match-requests/received`
- **认证**: 需要认证

**成功响应 (200)**:

```json
[
  {
    "id": "clxxx...",
    "fromUserId": "clyyy...",
    "toUserId": "clzzz...",
    "status": "PENDING",
    "createdAt": "2026-05-14T09:00:00.000Z",
    "fromUser": {
      "id": "clyyy...",
      "gender": "男",
      "campus": "仙林",
      "interests": ["篮球"]
    }
  }
]
```

> 只返回状态为 PENDING 的请求，同时自动过期超过 24h 的请求。

---

### 3.6 接受牵线请求

- **URL**: `POST /discovery/match-request/:id/accept`
- **认证**: 需要认证

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 牵线请求ID |

**成功响应 (200)**:

```json
{
  "request": {
    "id": "clxxx...",
    "status": "ACCEPTED"
  },
  "relationship": {
    "id": "clrrr...",
    "user1Id": "clyyy...",
    "user2Id": "clzzz...",
    "status": "ICEBREAKING",
    "createdAt": "2026-05-14T10:00:00.000Z"
  }
}
```

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 400 | 请求已处理 | 请求状态非 PENDING |
| 400 | 请求已过期 | 请求超过 24h |
| 403 | 只有目标用户才能响应此请求 | 非 toUser |
| 404 | 牵线请求不存在 | 请求ID无效 |

---

### 3.7 拒绝牵线请求

- **URL**: `POST /discovery/match-request/:id/reject`
- **认证**: 需要认证

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 牵线请求ID |

**成功响应 (200)**:

```json
{
  "id": "clxxx...",
  "status": "REJECTED"
}
```

---

## 四、聊天模块 `/chat`

### 4.1 获取聊天消息

- **URL**: `GET /chat/:relationshipId/messages`
- **认证**: 通过 `x-user-id` Header（WebSocket 场景复用）

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| relationshipId | string | 关系ID |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cursor | string | 否 | 游标（消息ID），用于分页 |
| limit | number | 否 | 每页数量，默认 50，最大 100 |

**成功响应 (200)**:

```json
{
  "messages": [
    {
      "id": "clxxx...",
      "relationshipId": "clrrr...",
      "senderId": "clyyy...",
      "content": "你好！",
      "type": "MAIN",
      "createdAt": "2026-05-14T10:00:00.000Z",
      "sender": {
        "id": "clyyy...",
        "nickname": "Alice",
        "avatar": "/uploads/avatars/yyy.jpg"
      }
    }
  ]
}
```

> 消息根据用户角色和军师模式进行可见性过滤。

---

### 4.2 获取聊天室在线状态

- **URL**: `GET /chat/:relationshipId/presence`
- **认证**: 通过 `x-user-id` Header

**成功响应 (200)**:

```json
{
  "presence": [
    { "userId": "clyyy...", "role": "client1", "online": true },
    { "userId": "clzzz...", "role": "client2", "online": false },
    { "userId": "clwww...", "role": "wingman1", "online": true }
  ]
}
```

---

### 4.3 更新关系状态

- **URL**: `POST /chat/:relationshipId/status`
- **认证**: 通过 `x-user-id` Header

**请求参数 (Body JSON)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 新状态：MATCHING/ICEBREAKING/FLIRTING/ENDED |

**成功响应 (200)**:

```json
{
  "success": true,
  "event": {
    "type": "roomOpened",
    "message": "破冰聊天已开启"
  }
}
```

---

### 4.4 WebSocket 事件

> 连接地址：`ws://host/socket.io`
> 认证：JWT Cookie 或 auth.userId（DEV 模式）

**客户端 → 服务端事件**:

| 事件名 | 数据 | 说明 |
|--------|------|------|
| `joinRoom` | `{ relationshipId }` | 加入聊天室 |
| `sendMessage` | `{ relationshipId, content, type, targetUserId? }` | 发送消息 |
| `draftMessage` | `{ relationshipId, content }` | 军师草拟消息（ASSIST 模式） |
| `confirmMessage` | `{ messageId, relationshipId }` | 当事人确认草拟消息 |
| `rejectMessage` | `{ messageId, relationshipId }` | 当事人拒绝草拟消息 |
| `forwardMessage` | `{ relationshipId, originalMessageId, targetUserId }` | 转发消息到私聊 |
| `switchMode` | `{ relationshipId, wingmanId, mode }` | 切换军师模式 |
| `proposeFlirting` | `{ relationshipId }` | 提议进入暧昧期 |
| `transitionStatus` | `{ relationshipId, newStatus }` | 状态转换 |

**服务端 → 客户端事件**:

| 事件名 | 数据 | 说明 |
|--------|------|------|
| `roomJoined` | `{ relationshipId, messages, role, wingmanMode1/2, ... }` | 成功加入聊天室 |
| `newMessage` | Message 对象 | 新消息 |
| `messageConfirmed` | Message 对象 | 草拟消息已确认 |
| `messageRejected` | `{ messageId }` | 草拟消息已拒绝 |
| `userJoined` | `{ userId, role }` | 用户加入 |
| `userOffline` | `{ userId }` | 用户离线 |
| `modeSwitched` | `{ wingmanId, mode }` | 军师模式切换 |
| `proposeFlirting` | `{ relationshipId, fromUserId }` | 收到暧昧期提议 |
| `roomReadOnly` | `{ relationshipId, reason, message }` | 聊天室变为只读（暧昧期） |
| `contactExchange` | `{ relationshipId, contactExchange }` | 联系方式交换 |
| `roomClosed` | `{ relationshipId, reason, message }` | 聊天室关闭 |
| `wingmanAssigned` | `{ relationshipId, wingmanId, side, mode }` | 军师分配通知 |
| `wingmanApproved` | `{ relationshipId, side, mode }` | 军师申请通过通知 |
| `error` | `{ code, message }` | 错误通知 |

---

## 五、军师任务模块 `/wingman-task`

> 本模块所有接口均需要 JWT 认证

### 5.1 创建军师任务

- **URL**: `POST /wingman-task`
- **认证**: 需要认证

**请求参数 (Body JSON)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| relationshipId | string | 是 | 关联关系ID |
| title | string | 是 | 任务标题 |
| description | string | 是 | 任务描述 |

**成功响应 (201)**:

```json
{
  "id": "clxxx...",
  "clientId": "clyyy...",
  "relationshipId": "clrrr...",
  "title": "帮我破冰！",
  "description": "对方喜欢摄影和音乐",
  "status": "OPEN",
  "createdAt": "2026-05-14T10:00:00.000Z"
}
```

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 400 | 只有在破冰期才能发布军师任务 | 关系状态非 ICEBREAKING |
| 403 | 你不是该关系的当事人 | 非关系当事人 |
| 409 | 已有一条进行中的招募任务 | 该用户在此关系中已有任务 |
| 409 | 己方已有军师，请先请出当前军师 | 该侧已分配军师 |

---

### 5.2 浏览开放任务

- **URL**: `GET /wingman-task`
- **认证**: 需要认证

**成功响应 (200)**:

```json
[
  {
    "id": "clxxx...",
    "clientId": "clyyy...",
    "title": "帮我破冰！",
    "description": "对方喜欢摄影和音乐",
    "status": "OPEN",
    "client": {
      "id": "clyyy...",
      "gender": "男",
      "campus": "仙林",
      "interests": ["篮球"]
    },
    "applicationCount": 3,
    "createdAt": "2026-05-14T10:00:00.000Z"
  }
]
```

---

### 5.3 按关系查询任务

- **URL**: `GET /wingman-task/by-relationship`
- **认证**: 需要认证

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| relationshipId | string | 是 | 关系ID |

**成功响应 (200)**: 返回该关系下当前用户发布的任务列表，含申请详情。

---

### 5.4 申请军师任务

- **URL**: `POST /wingman-task/:id/apply`
- **认证**: 需要认证

**成功响应 (201)**:

```json
{
  "id": "clxxx...",
  "taskId": "clttt...",
  "wingmanId": "clwww...",
  "status": "PENDING",
  "createdAt": "2026-05-14T10:00:00.000Z"
}
```

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 403 | 你不是军师 | 用户角色不含 WINGMAN |
| 403 | 军师认证未通过 | wingmanCertStatus 非 APPROVED |
| 403 | 不能申请自己发布的任务 | clientId === wingmanId |
| 409 | 你已经申请过该任务 | 重复申请 |
| 409 | 该任务已不可申请 | 任务状态非 OPEN |

---

### 5.5 审批申请（通过）

- **URL**: `POST /wingman-task/:id/approve`
- **认证**: 需要认证

**请求参数 (Body JSON)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| wingmanId | string | 是 | 要通过的军师ID |

**成功响应 (201)**:

```json
{
  "task": {
    "id": "clttt...",
    "status": "IN_PROGRESS",
    "wingmanId": "clwww..."
  },
  "assignment": {
    "id": "claaa...",
    "relationshipId": "clrrr...",
    "userId": "clwww...",
    "side": 1,
    "mode": "PRIVATE"
  }
}
```

> 审批通过后，其他待处理申请自动拒绝，并推送 WebSocket 通知给当事人和军师。

---

### 5.6 拒绝申请

- **URL**: `POST /wingman-task/:id/reject`
- **认证**: 需要认证

**请求参数 (Body JSON)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| wingmanId | string | 是 | 要拒绝的军师ID |

**成功响应 (200)**:

```json
{
  "id": "clxxx...",
  "status": "REJECTED"
}
```

---

### 5.7 取消任务

- **URL**: `DELETE /wingman-task/:id`
- **认证**: 需要认证

**成功响应 (200)**:

```json
{
  "id": "clttt...",
  "status": "CANCELLED"
}
```

> 取消任务时，若已有军师分配，会同时将分配记录标记为已离开（leftAt）。

---

## 六、信用分模块 `/credit`

> 本模块所有接口均需要 JWT 认证

### 6.1 查询信用分余额

- **URL**: `GET /credit/balance`
- **认证**: 需要认证

**成功响应 (200)**:

```json
{
  "balance": 23
}
```

---

### 6.2 每日签到

- **URL**: `POST /credit/checkin`
- **认证**: 需要认证

**成功响应 (201)**:

```json
{
  "balance": 26,
  "reward": 3
}
```

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 409 | 今日已签到 | 同一天重复签到 |

---

## 七、管理员模块 `/admin`

> 本模块所有接口均需要管理员权限（AdminGuard）

### 7.1 平台统计数据

- **URL**: `GET /admin/stats`
- **认证**: 管理员

**成功响应 (200)**:

```json
{
  "totalUsers": 150,
  "activeUsers": 80,
  "totalCredit": 3000,
  "totalRelationships": 45,
  "pendingMatchRequests": 12
}
```

---

### 7.2 用户列表

- **URL**: `GET /admin/users`
- **认证**: 管理员

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20 |
| search | string | 否 | 搜索（昵称/邮箱） |
| active | string | 否 | 过滤活跃状态："true"/"false" |

**成功响应 (200)**:

```json
{
  "users": [
    {
      "id": "clxxx...",
      "email": "test@smail.nju.edu.cn",
      "nickname": "Violet",
      "gender": "女",
      "roles": ["CLIENT"],
      "creditScore": 23,
      "isActive": true,
      "createdAt": "2026-03-01T08:00:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20
}
```

---

### 7.3 用户详情

- **URL**: `GET /admin/users/:id`
- **认证**: 管理员

**成功响应 (200)**:

```json
{
  "id": "clxxx...",
  "email": "test@smail.nju.edu.cn",
  "nickname": "Violet",
  "avatar": "/uploads/avatars/xxx.jpg",
  "gender": "女",
  "campus": "仙林",
  "grade": "大三",
  "major": "计算机科学",
  "interests": ["摄影"],
  "declaration": "...",
  "creditScore": 23,
  "isActive": true,
  "roles": ["CLIENT"],
  "wingmanCertStatus": "NONE",
  "wechat": "xxx",
  "qq": "xxx",
  "_count": {
    "checkinRecords": 30,
    "relationshipsAsUser1": 5,
    "relationshipsAsUser2": 3,
    "sentMatchRequests": 10,
    "receivedMatchRequests": 8
  },
  "creditLogs": [
    {
      "id": "cllll...",
      "amount": 5,
      "reason": "系统奖励",
      "createdAt": "2026-05-14T10:00:00.000Z",
      "admin": { "nickname": "Admin" }
    }
  ]
}
```

---

### 7.4 调整用户信用分

- **URL**: `POST /admin/users/:id/credit`
- **认证**: 管理员

**请求参数 (Body JSON)**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| amount | number | 是 | 调整量（正数增加，负数扣减） |
| reason | string | 是 | 调整原因 |

**成功响应 (201)**:

```json
{
  "id": "clxxx...",
  "creditScore": 28
}
```

**错误响应**:

| 状态码 | message | 说明 |
|--------|---------|------|
| 400 | 必须填写调整原因 | reason 为空 |
| 404 | 用户不存在 | 用户ID无效 |

---

### 7.5 切换用户活跃状态

- **URL**: `POST /admin/users/:id/toggle-active`
- **认证**: 管理员

**成功响应 (200)**:

```json
{
  "id": "clxxx...",
  "isActive": false
}
```

---

## 八、接口汇总

| 模块 | 数量 | 接口列表 |
|------|------|---------|
| Auth | 4 | register, login, logout, me |
| User | 9 | profile(GET/PATCH), getUserById, avatar, cardImage(POST/DELETE), wingman-certify, password, contact-email |
| Discovery | 7 | users, relationships, match-request(POST), sent, received, accept, reject |
| Chat | 3 + WS | messages, presence, status + 10 个 WebSocket 事件 |
| WingmanTask | 6 | create, list, by-relationship, apply, approve, reject, cancel |
| Credit | 2 | balance, checkin |
| Admin | 5 | stats, users, userDetail, credit, toggle-active |
| **合计** | **36** | |
