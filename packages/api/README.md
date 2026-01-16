# CMS API 服务器

Context Memory System REST API 服务器，基于 Hono 构建，提供高性能的记忆存储和检索服务。

## 快速开始

### 安装

```bash
# 在项目根目录
pnpm install
pnpm build
```

### 启动服务器

```bash
# 开发模式（自动重载）
cd packages/api
pnpm dev

# 生产模式
pnpm start
```

### 配置

通过环境变量配置：

```bash
PORT=3000                    # 服务器端口（默认：3000）
CMS_DB_PATH=~/.cms/memory.db # 数据库路径（默认：~/.cms/memory.db）
CMS_ENABLE_CACHE=true        # 启用缓存（默认：true）
CMS_CACHE_SIZE=100           # 缓存大小（默认：100）
NODE_ENV=production          # 环境（development/production）
```

## API 端点

### 健康检查

#### `GET /health`

检查服务器状态。

**响应示例**：
```json
{
  "status": "ok",
  "timestamp": "2026-01-14T09:32:25.125Z",
  "service": "Context Memory System API"
}
```

---

### 记忆管理

#### `POST /api/memories`

存储通用记忆。

**请求体**：
```json
{
  "content": "实现了用户认证功能",
  "projectId": "myapp",
  "type": "code",
  "tags": ["auth", "feature"],
  "sessionId": "session-123",
  "rawContext": {
    "files": ["auth.ts", "user.ts"],
    "linesChanged": 150
  }
}
```

**参数说明**：
- `content` (必需) - 记忆内容摘要
- `projectId` (必需) - 项目 ID
- `type` (可选) - 记忆类型：code/decision/solution/config/error/session（默认：code）
- `tags` (可选) - 标签数组
- `sessionId` (可选) - 会话 ID
- `rawContext` (可选) - 原始上下文数据（JSON 对象）

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "mem_abc123",
    "success": true
  }
}
```

---

#### `GET /api/memories/search`

检索记忆。

**查询参数**：
- `query` (必需) - 搜索关键词
- `project` (可选) - 项目 ID 过滤
- `type` (可选) - 类型过滤
- `tags` (可选) - 标签过滤（逗号分隔）
- `strategy` (可选) - 检索策略：exact/fulltext/semantic/auto（默认：exact）
- `limit` (可选) - 返回数量（默认：10）

**请求示例**：
```
GET /api/memories/search?query=认证&project=myapp&tags=auth,feature&limit=5
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "meta": {
        "id": "mem_abc123",
        "projectId": "myapp",
        "type": "code",
        "tags": ["auth", "feature"],
        "timestamp": "2026-01-14T09:00:00.000Z",
        "version": 1
      },
      "content": {
        "summary": "实现了用户认证功能",
        "data": {
          "files": ["auth.ts", "user.ts"]
        }
      },
      "relations": {},
      "searchable": {
        "keywords": ["auth", "feature"],
        "fullText": "实现了用户认证功能"
      },
      "createdAt": "2026-01-14T09:00:00.000Z",
      "updatedAt": "2026-01-14T09:00:00.000Z"
    }
  ],
  "cacheHit": false,
  "count": 1,
  "total": 1,
  "took": 2
}
```

---

#### `GET /api/memories/:id`

获取单个记忆详情。

**请求示例**：
```
GET /api/memories/mem_abc123
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "meta": { ... },
    "content": { ... },
    "relations": { ... }
  }
}
```

---

### 决策管理

#### `POST /api/decisions`

存储架构决策。

**请求体**：
```json
{
  "question": "选择前端框架",
  "options": [
    {
      "name": "React",
      "pros": ["生态好", "社区活跃"],
      "cons": ["学习曲线陡"]
    },
    {
      "name": "Vue",
      "pros": ["简单", "上手快"],
      "cons": ["生态较小"]
    }
  ],
  "chosen": "React",
  "reason": "团队熟悉度高，生态完善",
  "projectId": "myapp",
  "tags": ["frontend", "architecture"],
  "sessionId": "session-123"
}
```

**参数说明**：
- `question` (必需) - 决策问题
- `options` (必需) - 选项数组，每个选项包含 name、pros、cons
- `chosen` (必需) - 选择的方案名称
- `reason` (必需) - 选择理由
- `projectId` (必需) - 项目 ID
- `tags` (可选) - 标签数组
- `sessionId` (可选) - 会话 ID

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "mem_decision123",
    "success": true
  }
}
```

---

### 解决方案管理

#### `POST /api/solutions`

存储问题解决方案。

**请求体**：
```json
{
  "problem": "数据库查询性能差",
  "rootCause": "缺少索引，N+1 查询",
  "solution": "添加复合索引，使用 DataLoader 批量查询",
  "prevention": "定期性能监控，code review 检查查询",
  "relatedIssues": ["issue-001", "issue-002"],
  "projectId": "myapp",
  "tags": ["performance", "database"],
  "sessionId": "session-123"
}
```

**参数说明**：
- `problem` (必需) - 问题描述
- `rootCause` (必需) - 根本原因
- `solution` (必需) - 解决方案
- `prevention` (可选) - 预防措施
- `relatedIssues` (可选) - 关联问题数组
- `projectId` (必需) - 项目 ID
- `tags` (可选) - 标签数组
- `sessionId` (可选) - 会话 ID

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "mem_solution123",
    "success": true
  }
}
```

---

### 会话管理

#### `POST /api/sessions`

存储会话总结。

**请求体**：
```json
{
  "summary": "完成了用户认证模块开发",
  "sessionId": "session-123",
  "projectId": "myapp",
  "decisions": ["选择 JWT 认证", "启用 2FA"],
  "unfinishedTasks": ["添加单元测试", "编写 API 文档"],
  "nextSteps": ["集成测试", "部署到预发布环境"]
}
```

**参数说明**：
- `summary` (必需) - 会话总结
- `sessionId` (必需) - 会话 ID
- `projectId` (必需) - 项目 ID
- `decisions` (可选) - 本次做出的决策数组
- `unfinishedTasks` (可选) - 未完成任务数组
- `nextSteps` (可选) - 下一步计划数组

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "mem_session123",
    "success": true
  }
}
```

---

### 时间线

#### `GET /api/timeline/:projectId`

获取项目时间线。

**查询参数**：
- `type` (可选) - 类型过滤
- `limit` (可选) - 返回数量（默认：50）

**请求示例**：
```
GET /api/timeline/myapp?type=decision&limit=20
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "memory": { ... },
      "prevMemoryId": "mem_xxx",
      "nextMemoryId": "mem_yyy"
    }
  ],
  "count": 3,
  "total": 3
}
```

---

### 关系链

#### `GET /api/relations/:memoryId`

获取记忆关系链。

**查询参数**：
- `depth` (可选) - 递归深度（默认：2）

**请求示例**：
```
GET /api/relations/mem_abc123?depth=3
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "memory": { ... },
    "related": [
      {
        "memory": { ... },
        "related": [ ... ]
      }
    ]
  }
}
```

---

## 错误处理

所有错误响应遵循统一格式：

```json
{
  "error": "错误类型",
  "message": "错误详细信息"
}
```

### 常见错误码

- `400 Bad Request` - 缺少必需参数或参数格式错误
- `404 Not Found` - 资源不存在
- `500 Internal Server Error` - 服务器内部错误

### 错误示例

```json
{
  "error": "Bad Request",
  "message": "缺少必需参数: content, projectId"
}
```

---

## 使用示例

### cURL

```bash
# 存储记忆
curl -X POST http://localhost:3000/api/memories \
  -H "Content-Type: application/json" \
  -d '{
    "content": "实现了API服务器",
    "projectId": "test-api",
    "type": "code",
    "tags": ["api", "rest"]
  }'

# 检索记忆
curl "http://localhost:3000/api/memories/search?query=API&project=test-api"

# 存储决策
curl -X POST http://localhost:3000/api/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "question": "选择API框架",
    "options": [
      {"name": "Express", "pros": ["成熟"], "cons": ["慢"]},
      {"name": "Hono", "pros": ["快"], "cons": ["新"]}
    ],
    "chosen": "Hono",
    "reason": "性能更好",
    "projectId": "test-api"
  }'

# 获取时间线
curl "http://localhost:3000/api/timeline/test-api?limit=10"
```

### JavaScript (fetch)

```javascript
// 存储记忆
const response = await fetch('http://localhost:3000/api/memories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: '实现了API服务器',
    projectId: 'test-api',
    type: 'code',
    tags: ['api', 'rest']
  })
});
const data = await response.json();
console.log('记忆ID:', data.data.id);

// 检索记忆
const searchResponse = await fetch(
  'http://localhost:3000/api/memories/search?query=API&project=test-api&limit=5'
);
const searchData = await searchResponse.json();
console.log('找到', searchData.count, '条记忆');
```

### Python (requests)

```python
import requests

# 存储记忆
response = requests.post(
    'http://localhost:3000/api/memories',
    json={
        'content': '实现了API服务器',
        'projectId': 'test-api',
        'type': 'code',
        'tags': ['api', 'rest']
    }
)
data = response.json()
print(f"记忆ID: {data['data']['id']}")

# 检索记忆
search_response = requests.get(
    'http://localhost:3000/api/memories/search',
    params={'query': 'API', 'project': 'test-api', 'limit': 5}
)
search_data = search_response.json()
print(f"找到 {search_data['count']} 条记忆")
```

---

## 性能优化

### 缓存

API 服务器默认启用 LRU 缓存，缓存检索结果。缓存命中时，`cacheHit` 字段为 `true`，`took` 时间会显著减少。

### 连接池

使用单例模式管理 SQLite 连接，避免频繁打开/关闭数据库。

### 批量操作

建议使用批量 API（如果需要存储多条记忆）而不是多次单独调用。

---

## 开发

### 项目结构

```
packages/api/
├── src/
│   ├── index.ts              # 主入口，Hono 应用配置
│   ├── middleware/
│   │   └── error.ts          # 错误处理中间件
│   ├── routes/
│   │   ├── memory.ts         # 记忆 CRUD
│   │   ├── decision.ts       # 决策存储
│   │   ├── solution.ts       # 解决方案存储
│   │   ├── session.ts        # 会话存储
│   │   ├── timeline.ts       # 时间线查询
│   │   └── relations.ts      # 关系链查询
│   └── utils/
│       └── storage.ts        # 存储实例管理
├── dist/                     # 编译输出
├── package.json
├── tsconfig.json
└── README.md                 # 本文档
```

### 添加新路由

1. 在 `src/routes/` 创建新文件
2. 导出 Hono 应用实例
3. 在 `src/index.ts` 注册路由

示例：

```typescript
// src/routes/custom.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/hello', (c) => {
  return c.json({ message: 'Hello World' });
});

export const customRoutes = app;
```

```typescript
// src/index.ts
import { customRoutes } from './routes/custom.js';

app.route('/api/custom', customRoutes);
```

### 测试

```bash
# 单元测试
pnpm test

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
```

---

## 部署

### Docker（推荐）

创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

构建和运行：

```bash
docker build -t cms-api .
docker run -p 3000:3000 -v ~/.cms:/root/.cms cms-api
```

### PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start dist/index.js --name cms-api

# 查看日志
pm2 logs cms-api

# 重启
pm2 restart cms-api
```

### systemd

创建 `/etc/systemd/system/cms-api.service`：

```ini
[Unit]
Description=CMS API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/cms-api
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl enable cms-api
sudo systemctl start cms-api
sudo systemctl status cms-api
```

---

## 技术栈

- **框架**: [Hono](https://hono.dev/) - 轻量级、超快速的 Web 框架
- **运行时**: Node.js 18+
- **语言**: TypeScript
- **存储**: SQLite（通过 @cms/storage）
- **中间件**:
  - CORS - 跨域支持
  - Logger - 请求日志
  - Pretty JSON - 格式化 JSON 输出

---

## 常见问题

### Q: 如何更改数据库路径？

A: 设置环境变量 `CMS_DB_PATH`：
```bash
export CMS_DB_PATH=/custom/path/memory.db
node dist/index.js
```

### Q: 如何禁用缓存？

A: 设置环境变量 `CMS_ENABLE_CACHE=false`。

### Q: 如何启用详细日志？

A: Hono 的 logger 中间件会记录所有请求。生产环境建议使用专业日志工具如 Winston 或 Pino。

### Q: 支持 HTTPS 吗？

A: API 服务器本身不处理 HTTPS，建议使用 Nginx 或 Caddy 作为反向代理。

### Q: 如何限流？

A: 可以添加 Hono 中间件或在反向代理层面处理（推荐）。

---

## 许可证

MIT
