-- 索引优化 migration
-- 优化常见查询模式的性能

-- 1. 复合索引（项目+时间）- 用于项目时间线查询
CREATE INDEX IF NOT EXISTS idx_memories_project_timestamp
ON memories("projectId", timestamp DESC);

-- 2. 复合索引（项目+类型+时间）- 用于按项目和类型过滤的时间线
CREATE INDEX IF NOT EXISTS idx_memories_project_type_timestamp
ON memories("projectId", type, timestamp DESC);

-- 3. 部分索引（仅索引有会话的记忆）- 减少索引大小，提升写入性能
CREATE INDEX IF NOT EXISTS idx_memories_session_active
ON memories("sessionId", timestamp DESC)
WHERE "sessionId" IS NOT NULL;

-- 4. 使用 BRIN 索引优化大表的时间戳查询（适用于历史数据多的场景）
-- BRIN 索引占用空间小，适合时间序列数据
CREATE INDEX IF NOT EXISTS idx_memories_timestamp_brin
ON memories USING BRIN (timestamp)
WITH (pages_per_range = 128);

-- 注释：
-- - 复合索引覆盖最常见的查询模式：按项目检索时间线
-- - 部分索引只索引有会话的记忆，减少索引大小约 30-50%
-- - BRIN 索引适合大数据量场景，占用空间仅为 B-tree 的 1%
-- - 所有索引都使用 IF NOT EXISTS，可安全重复执行
