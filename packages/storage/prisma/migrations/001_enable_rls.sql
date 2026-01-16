-- Enable Row Level Security for memories table
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能查看自己项目的记忆
-- 注意：这里假设有一个 auth.uid() 函数返回当前用户ID
-- 实际使用时需要配合Supabase或其他认证系统

-- 策略1：允许用户查看自己项目的记忆
CREATE POLICY "Users can view their own project memories"
ON memories
FOR SELECT
USING (
  -- 假设projectId格式为 "user_{userId}_{projectName}"
  -- 或者通过独立的 user_projects 表关联
  TRUE  -- 暂时允许所有查询，实际应该检查用户权限
);

-- 策略2：允许用户插入自己项目的记忆
CREATE POLICY "Users can insert memories to their projects"
ON memories
FOR INSERT
WITH CHECK (
  TRUE  -- 暂时允许所有插入，实际应该检查用户权限
);

-- 策略3：允许用户更新自己项目的记忆
CREATE POLICY "Users can update their own project memories"
ON memories
FOR UPDATE
USING (
  TRUE  -- 暂时允许所有更新，实际应该检查用户权限
)
WITH CHECK (
  TRUE
);

-- 策略4：允许用户删除自己项目的记忆
CREATE POLICY "Users can delete their own project memories"
ON memories
FOR DELETE
USING (
  TRUE  -- 暂时允许所有删除，实际应该检查用户权限
);

-- 创建全文搜索索引（使用PostgreSQL的GIN索引）
CREATE INDEX IF NOT EXISTS memories_fulltext_idx
ON memories
USING GIN (to_tsvector('english', fullText));

-- 创建数组搜索索引（用于tags和keywords）
CREATE INDEX IF NOT EXISTS memories_tags_idx
ON memories
USING GIN (tags);

CREATE INDEX IF NOT EXISTS memories_keywords_idx
ON memories
USING GIN (keywords);

-- 注释：
-- 在生产环境中，你需要：
-- 1. 创建 user_projects 表来管理用户-项目关联
-- 2. 修改上述策略中的 TRUE 为实际的权限检查逻辑
-- 3. 使用 auth.uid() 或类似函数获取当前用户ID
-- 4. 示例权限检查：
--    EXISTS (
--      SELECT 1 FROM user_projects
--      WHERE user_id = auth.uid()
--      AND project_id = memories.projectId
--    )
