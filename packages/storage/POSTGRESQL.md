# PostgreSQL 部署指南

## 前置要求

- PostgreSQL 14+ 数据库
- Node.js 18+
- pnpm 8+

## 环境变量配置

在 `.env` 文件中配置数据库连接：

```bash
# PostgreSQL连接字符串
DATABASE_URL="postgresql://username:password@localhost:5432/cms_db?schema=public"
```

## 数据库初始化

### 1. 生成Prisma Client

```bash
pnpm --filter @cms/storage prisma:generate
```

### 2. 创建初始迁移

```bash
pnpm --filter @cms/storage prisma:migrate
```

这将执行以下操作：
- 创建 `memories` 表
- 创建所有必要的索引
- 应用 Prisma schema 定义

### 3. 手动应用RLS策略（可选，用于生产环境）

如果使用Supabase或需要Row Level Security：

```bash
psql $DATABASE_URL -f packages/storage/prisma/migrations/001_enable_rls.sql
```

## 使用方法

```typescript
import { PostgreSQLStorage } from '@cms/storage';

// 使用环境变量中的DATABASE_URL
const storage = new PostgreSQLStorage();

// 或者显式传入连接字符串
const storage = new PostgreSQLStorage('postgresql://...');

// 存储记忆
await storage.store({
  content: '实现了JWT认证',
  rawContext: { feature: 'auth' },
  projectId: 'my-project',
  tags: ['auth', 'jwt'],
});

// 检索记忆
const result = await storage.recall({
  query: 'JWT',
  projectId: 'my-project',
});

// 关闭连接
await storage.close();
```

## 生产环境优化

### 1. 连接池配置

在 `schema.prisma` 中添加：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // 连接池配置
  pool_size     = 20
  pool_timeout  = 30
}
```

### 2. 启用全文搜索

PostgreSQL支持更强大的全文搜索：

```sql
-- 创建tsvector列（可选）
ALTER TABLE memories ADD COLUMN search_vector tsvector;

-- 创建GIN索引
CREATE INDEX memories_search_idx ON memories USING GIN(search_vector);

-- 创建触发器自动更新search_vector
CREATE FUNCTION memories_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.fullText, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER memories_search_update
BEFORE INSERT OR UPDATE ON memories
FOR EACH ROW EXECUTE FUNCTION memories_search_trigger();
```

### 3. Row Level Security配置

如果使用Supabase或需要多租户隔离：

1. 创建 `user_projects` 关联表：

```sql
CREATE TABLE user_projects (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);
```

2. 更新RLS策略（修改 `001_enable_rls.sql`）：

```sql
-- 查询策略
CREATE POLICY "Users can view their own project memories"
ON memories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_projects
    WHERE user_id = auth.uid()
    AND project_id = memories."projectId"
  )
);
```

## 监控和维护

### 查看慢查询

```sql
-- 启用慢查询日志
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1秒

-- 查看慢查询
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 定期清理

```sql
-- 清理旧的会话记忆（90天前）
DELETE FROM memories
WHERE type = 'session'
AND "createdAt" < NOW() - INTERVAL '90 days';

-- 定期VACUUM
VACUUM ANALYZE memories;
```

## 故障排查

### 连接问题

```bash
# 测试连接
psql $DATABASE_URL -c "SELECT version();"
```

### 迁移问题

```bash
# 重置数据库（警告：会删除所有数据！）
pnpm --filter @cms/storage exec prisma migrate reset

# 查看迁移状态
pnpm --filter @cms/storage exec prisma migrate status
```

### 性能问题

```sql
-- 检查索引使用情况
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;

-- 检查表大小
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```
