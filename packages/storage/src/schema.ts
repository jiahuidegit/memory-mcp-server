import type Database from 'better-sqlite3';

/**
 * 数据库迁移：为旧表添加 embedding 字段
 */
function migrateEmbeddingColumn(db: Database.Database): void {
  // 检查 embedding 列是否存在
  const columns = db.pragma('table_info(memories)') as { name: string }[];
  const hasEmbedding = columns.some((col) => col.name === 'embedding');

  if (!hasEmbedding) {
    console.log('📦 迁移: 添加 embedding 字段...');
    db.exec('ALTER TABLE memories ADD COLUMN embedding TEXT');
    console.log('✅ 迁移完成');
  }
}

/**
 * 初始化数据库Schema
 */
export function initSchema(db: Database.Database): void {
  // 1. 创建memories主表
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      sessionId TEXT,
      timestamp TEXT NOT NULL,
      type TEXT NOT NULL,
      tags TEXT, -- JSON数组: ["tag1", "tag2"]
      version INTEGER DEFAULT 1,

      -- content
      summary TEXT NOT NULL,
      data TEXT, -- JSON对象

      -- relations
      replaces TEXT, -- JSON数组
      relatedTo TEXT, -- JSON数组
      impacts TEXT, -- JSON数组
      derivedFrom TEXT,

      -- context（特定类型的上下文数据）
      context TEXT, -- JSON对象

      -- searchable
      keywords TEXT, -- JSON数组
      fullText TEXT,
      embedding TEXT, -- Base64 编码的向量（用于语义搜索）

      -- 时间戳
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,

      -- 索引字段
      UNIQUE(id)
    );
  `);

  // 2. 创建索引
  db.exec(`
    -- 项目ID索引（频繁按项目查询）
    CREATE INDEX IF NOT EXISTS idx_memories_projectId ON memories(projectId);

    -- 会话ID索引
    CREATE INDEX IF NOT EXISTS idx_memories_sessionId ON memories(sessionId);

    -- 类型索引
    CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);

    -- 时间戳索引（用于时间线查询）
    CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp DESC);

    -- 复合索引（项目+类型）- 用于按项目和类型过滤
    CREATE INDEX IF NOT EXISTS idx_memories_project_type ON memories(projectId, type);

    -- 复合索引（项目+时间）- 用于项目时间线查询，性能提升显著
    CREATE INDEX IF NOT EXISTS idx_memories_project_timestamp ON memories(projectId, timestamp DESC);

    -- 复合索引（项目+类型+时间）- 用于按项目和类型过滤的时间线
    CREATE INDEX IF NOT EXISTS idx_memories_project_type_timestamp ON memories(projectId, type, timestamp DESC);

    -- 部分索引（仅索引有会话的记忆）- 减少索引大小
    CREATE INDEX IF NOT EXISTS idx_memories_session_active ON memories(sessionId, timestamp DESC)
      WHERE sessionId IS NOT NULL;
  `);

  // 3. 创建FTS5全文搜索表
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
      summary,
      fullText,
      tokenize = 'unicode61'
    );
  `);

  // 4. 创建触发器，自动同步FTS表
  db.exec(`
    -- 插入触发器
    CREATE TRIGGER IF NOT EXISTS memories_fts_insert AFTER INSERT ON memories BEGIN
      INSERT INTO memories_fts(rowid, summary, fullText)
      VALUES (new.rowid, new.summary, new.fullText);
    END;

    -- 更新触发器
    CREATE TRIGGER IF NOT EXISTS memories_fts_update AFTER UPDATE ON memories BEGIN
      UPDATE memories_fts
      SET summary = new.summary, fullText = new.fullText
      WHERE rowid = new.rowid;
    END;

    -- 删除触发器
    CREATE TRIGGER IF NOT EXISTS memories_fts_delete AFTER DELETE ON memories BEGIN
      DELETE FROM memories_fts WHERE rowid = old.rowid;
    END;
  `);

  // 5. 数据库迁移（兼容旧数据库）
  migrateEmbeddingColumn(db);
}
