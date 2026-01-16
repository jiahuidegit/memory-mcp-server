import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import {
  type IStorage,
  type SearchFilters,
  type SearchResult,
  type TimelineOptions,
  type TimelineResult,
  type TimelineEntry,
  type RelationsOptions,
  type RelationNode,
  MemoryType,
  SearchStrategy,
  type Memory,
  type DecisionContext,
  type SolutionContext,
  type SessionContext,
} from '@emp/core';
import { initSchema } from './schema.js';
import { LRUCache } from './cache.js';

/**
 * SQLite存储实现
 */
export class SQLiteStorage implements IStorage {
  private db: Database.Database;
  private cache: LRUCache | null;

  constructor(dbPath: string = ':memory:', options?: { enableCache?: boolean; cacheSize?: number }) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // 性能优化：Write-Ahead Logging
    this.db.pragma('foreign_keys = ON');
    initSchema(this.db); // 初始化Schema

    // 初始化缓存（默认启用，容量100）
    this.cache = options?.enableCache !== false ? new LRUCache(options?.cacheSize || 100) : null;
  }

  /**
   * 通用存储方法
   */
  async store(params: {
    content: string;
    rawContext: Record<string, unknown>;
    projectId: string;
    type?: MemoryType;
    tags?: string[];
    sessionId?: string;
    relations?: {
      replaces?: string[];
      relatedTo?: string[];
      impacts?: string[];
      derivedFrom?: string;
    };
  }): Promise<{ id: string; success: boolean }> {
    const id = `mem_${nanoid()}`;
    const timestamp = new Date().toISOString();
    const memoryType = params.type || MemoryType.CODE;

    const stmt = this.db.prepare(`
      INSERT INTO memories (
        id, projectId, sessionId, timestamp, type, tags,
        summary, data, replaces, relatedTo, impacts, derivedFrom,
        context, keywords, fullText, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      params.projectId,
      params.sessionId || null,
      timestamp,
      memoryType,
      params.tags ? JSON.stringify(params.tags) : null,
      params.content, // summary
      JSON.stringify(params.rawContext), // data
      params.relations?.replaces ? JSON.stringify(params.relations.replaces) : null,
      params.relations?.relatedTo ? JSON.stringify(params.relations.relatedTo) : null,
      params.relations?.impacts ? JSON.stringify(params.relations.impacts) : null,
      params.relations?.derivedFrom || null,
      JSON.stringify(params.rawContext), // context
      params.tags ? JSON.stringify(params.tags) : null, // keywords
      params.content, // fullText
      timestamp,
      timestamp
    );

    // 失效相关缓存
    if (this.cache) {
      this.cache.invalidateProject(params.projectId);
    }

    return { id, success: true };
  }

  /**
   * 存储决策记忆
   */
  async storeDecision(
    params: DecisionContext & {
      projectId: string;
      tags?: string[];
      sessionId?: string;
      relations?: {
        replaces?: string[];
        relatedTo?: string[];
        impacts?: string[];
        derivedFrom?: string;
      };
    }
  ): Promise<{ id: string; success: boolean }> {
    const id = `mem_${nanoid()}`;
    const timestamp = new Date().toISOString();
    const summary = `[决策] ${params.question}`;
    const fullText = `${params.question} ${params.options.map((o) => o.name).join(' ')} ${params.reason}`;
    const keywords = [...(params.tags || []), ...params.options.map((o) => o.name), params.chosen];

    const stmt = this.db.prepare(`
      INSERT INTO memories (
        id, projectId, sessionId, timestamp, type, tags,
        summary, data, replaces, relatedTo, impacts, derivedFrom,
        context, keywords, fullText, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      params.projectId,
      params.sessionId || null,
      timestamp,
      MemoryType.DECISION,
      params.tags ? JSON.stringify(params.tags) : null,
      summary,
      JSON.stringify({}), // data为空
      params.relations?.replaces ? JSON.stringify(params.relations.replaces) : null,
      params.relations?.relatedTo ? JSON.stringify(params.relations.relatedTo) : null,
      params.relations?.impacts ? JSON.stringify(params.relations.impacts) : null,
      params.relations?.derivedFrom || null,
      JSON.stringify({
        question: params.question,
        options: params.options,
        chosen: params.chosen,
        reason: params.reason,
      }),
      JSON.stringify(keywords),
      fullText,
      timestamp,
      timestamp
    );

    // 失效相关缓存
    if (this.cache) {
      this.cache.invalidateProject(params.projectId);
    }

    return { id, success: true };
  }

  /**
   * 存储解决方案记忆
   */
  async storeSolution(
    params: SolutionContext & {
      projectId: string;
      tags?: string[];
      sessionId?: string;
      artifacts?: Record<string, string>;
      relations?: {
        replaces?: string[];
        relatedTo?: string[];
        impacts?: string[];
        derivedFrom?: string;
      };
    }
  ): Promise<{ id: string; success: boolean }> {
    const id = `mem_${nanoid()}`;
    const timestamp = new Date().toISOString();
    const summary = `[方案] ${params.problem}`;
    const fullText = `${params.problem} ${params.rootCause} ${params.solution} ${params.prevention || ''} ${params.relatedIssues?.join(' ') || ''}`;
    const keywords = [...(params.tags || []), ...(params.relatedIssues || [])];

    const stmt = this.db.prepare(`
      INSERT INTO memories (
        id, projectId, sessionId, timestamp, type, tags,
        summary, data, replaces, relatedTo, impacts, derivedFrom,
        context, keywords, fullText, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      params.projectId,
      params.sessionId || null,
      timestamp,
      MemoryType.SOLUTION,
      params.tags ? JSON.stringify(params.tags) : null,
      summary,
      JSON.stringify(params.artifacts || {}),
      params.relations?.replaces ? JSON.stringify(params.relations.replaces) : null,
      params.relations?.relatedTo ? JSON.stringify(params.relations.relatedTo) : null,
      params.relations?.impacts ? JSON.stringify(params.relations.impacts) : null,
      params.relations?.derivedFrom || null,
      JSON.stringify({
        problem: params.problem,
        rootCause: params.rootCause,
        solution: params.solution,
        prevention: params.prevention,
        relatedIssues: params.relatedIssues,
      }),
      JSON.stringify(keywords),
      fullText,
      timestamp,
      timestamp
    );

    // 失效相关缓存
    if (this.cache) {
      this.cache.invalidateProject(params.projectId);
    }

    return { id, success: true };
  }

  /**
   * 存储会话记忆
   */
  async storeSession(
    params: SessionContext & {
      projectId: string;
      sessionId?: string;
    }
  ): Promise<{ id: string; success: boolean }> {
    const id = `mem_${nanoid()}`;
    const timestamp = new Date().toISOString();
    const summary = `[会话] ${params.summary}`;
    const fullText = `${params.summary} ${params.decisions?.join(' ') || ''} ${params.unfinishedTasks?.join(' ') || ''} ${params.nextSteps?.join(' ') || ''}`;
    const keywords = [...(params.decisions || []), ...(params.unfinishedTasks || [])];

    const stmt = this.db.prepare(`
      INSERT INTO memories (
        id, projectId, sessionId, timestamp, type, tags,
        summary, data, replaces, relatedTo, impacts, derivedFrom,
        context, keywords, fullText, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      id,
      params.projectId,
      params.sessionId || id, // 使用当前id作为sessionId
      timestamp,
      MemoryType.SESSION,
      null, // tags
      summary,
      JSON.stringify({}),
      null, // replaces
      null, // relatedTo
      null, // impacts
      null, // derivedFrom
      JSON.stringify({
        summary: params.summary,
        decisions: params.decisions,
        unfinishedTasks: params.unfinishedTasks,
        nextSteps: params.nextSteps,
      }),
      JSON.stringify(keywords),
      fullText,
      timestamp,
      timestamp
    );

    // 失效相关缓存
    if (this.cache) {
      this.cache.invalidateProject(params.projectId);
    }

    return { id, success: true };
  }

  /**
   * 检索记忆
   */
  async recall(filters: SearchFilters): Promise<SearchResult> {
    const startTime = Date.now();

    // 检查缓存
    if (this.cache) {
      const cacheKey = LRUCache.generateKey(filters);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached; // 缓存命中，直接返回
      }
    }

    const strategy = filters.strategy || SearchStrategy.AUTO;
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;

    let actualStrategy: SearchStrategy;
    let results: Memory[];
    let dbStartTime: number;
    let dbEndTime: number;
    let parseStartTime: number;

    // 策略选择
    const strategyStartTime = Date.now();

    // L1: 精确匹配（优先）
    if (strategy === SearchStrategy.EXACT || strategy === SearchStrategy.AUTO) {
      dbStartTime = Date.now();
      results = this.exactSearch(filters, limit, offset);
      dbEndTime = Date.now();
      actualStrategy = SearchStrategy.EXACT;

      // 如果L1找不到结果，降级到L2全文搜索
      if (results.length === 0 && strategy === SearchStrategy.AUTO) {
        dbStartTime = Date.now();
        results = this.fulltextSearch(filters, limit, offset);
        dbEndTime = Date.now();
        actualStrategy = SearchStrategy.FULLTEXT;
      }
    }
    // L2: 全文搜索
    else if (strategy === SearchStrategy.FULLTEXT) {
      dbStartTime = Date.now();
      results = this.fulltextSearch(filters, limit, offset);
      dbEndTime = Date.now();
      actualStrategy = SearchStrategy.FULLTEXT;
    }
    // L3: 语义检索（暂未实现）
    else {
      dbStartTime = Date.now();
      results = this.fulltextSearch(filters, limit, offset);
      dbEndTime = Date.now();
      actualStrategy = SearchStrategy.FULLTEXT;
    }

    const strategyTime = Date.now() - strategyStartTime;
    const took = Date.now() - startTime;

    // 计算解析时间（总时间 - 数据库时间）
    const dbTime = dbEndTime - dbStartTime;
    const parseTime = took - dbTime - strategyTime;

    const result: SearchResult = {
      memories: results,
      total: results.length,
      strategy: actualStrategy,
      took,
      metrics: {
        dbTime,
        parseTime: Math.max(0, parseTime), // 确保非负
        strategyTime,
        cacheHit: false, // 数据库查询，标记为未命中
      },
    };

    // 写入缓存
    if (this.cache) {
      const cacheKey = LRUCache.generateKey(filters);
      this.cache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * L1: 精确匹配检索
   */
  private exactSearch(filters: SearchFilters, limit: number, offset: number): Memory[] {
    let sql = 'SELECT * FROM memories WHERE 1=1';
    const params: any[] = [];

    if (filters.projectId) {
      sql += ' AND projectId = ?';
      params.push(filters.projectId);
    }

    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.sessionId) {
      sql += ' AND sessionId = ?';
      params.push(filters.sessionId);
    }

    // 精确匹配：在summary或fullText中查找完整query
    if (filters.query) {
      sql += ' AND (summary LIKE ? OR fullText LIKE ?)';
      params.push(`%${filters.query}%`, `%${filters.query}%`);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map(this.rowToMemory);
  }

  /**
   * L2: 全文搜索（FTS5）
   */
  private fulltextSearch(filters: SearchFilters, limit: number, offset: number): Memory[] {
    // 先不用FTS5，退化为LIKE查询
    // TODO: 调试FTS5后再启用
    let sql = 'SELECT * FROM memories WHERE 1=1';
    const params: any[] = [];

    if (filters.projectId) {
      sql += ' AND projectId = ?';
      params.push(filters.projectId);
    }

    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.sessionId) {
      sql += ' AND sessionId = ?';
      params.push(filters.sessionId);
    }

    if (filters.query) {
      // 使用LIKE实现简单的全文搜索
      sql += ' AND (summary LIKE ? OR fullText LIKE ?)';
      params.push(`%${filters.query}%`, `%${filters.query}%`);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map(this.rowToMemory);
  }

  /**
   * 获取时间线
   */
  async getTimeline(options: TimelineOptions): Promise<TimelineResult> {
    let sql = 'SELECT * FROM memories WHERE projectId = ?';
    const params: any[] = [options.projectId];

    if (options.type) {
      sql += ' AND type = ?';
      params.push(options.type);
    }

    if (options.dateRange) {
      sql += ' AND timestamp >= ? AND timestamp <= ?';
      params.push(options.dateRange[0], options.dateRange[1]);
    }

    sql += ' ORDER BY timestamp DESC';

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    if (options.offset) {
      sql += ' OFFSET ?';
      params.push(options.offset);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    const memories = rows.map(this.rowToMemory);

    const entries: TimelineEntry[] = memories.map((memory, index) => ({
      memory,
      prevMemoryId: index > 0 ? memories[index - 1].meta.id : undefined,
      nextMemoryId: index < memories.length - 1 ? memories[index + 1].meta.id : undefined,
    }));

    return {
      entries,
      total: entries.length,
    };
  }

  /**
   * 获取关系链
   */
  async getRelations(options: RelationsOptions): Promise<RelationNode> {
    const memory = await this.getById(options.memoryId);
    if (!memory) {
      throw new Error(`Memory ${options.memoryId} not found`);
    }

    const depth = options.depth || 1;
    const relatedNodes: RelationNode[] = [];

    if (depth > 0) {
      // 查找所有相关记忆
      const relatedIds = [
        ...(memory.relations.replaces || []),
        ...(memory.relations.relatedTo || []),
        ...(memory.relations.impacts || []),
      ];

      if (memory.relations.derivedFrom) {
        relatedIds.push(memory.relations.derivedFrom);
      }

      for (const relatedId of relatedIds) {
        const relatedMemory = await this.getById(relatedId);
        if (relatedMemory) {
          // 递归查询关系链
          let nestedRelated: RelationNode[] | undefined = undefined;
          if (depth > 1) {
            const nestedResult = await this.getRelations({
              memoryId: relatedId,
              depth: depth - 1,
            });
            nestedRelated = nestedResult.related;
          }

          relatedNodes.push({
            memory: relatedMemory,
            related: nestedRelated,
          });
        }
      }
    }

    return {
      memory,
      related: relatedNodes.length > 0 ? relatedNodes : undefined,
    };
  }

  /**
   * 删除记忆
   */
  async delete(memoryId: string): Promise<{ success: boolean }> {
    // 先查询 projectId 用于缓存失效
    if (this.cache) {
      const memory = this.db.prepare('SELECT projectId FROM memories WHERE id = ?').get(memoryId) as {
        projectId: string;
      } | undefined;
      if (memory) {
        this.cache.invalidateProject(memory.projectId);
      }
    }

    const stmt = this.db.prepare('DELETE FROM memories WHERE id = ?');
    const result = stmt.run(memoryId);
    return { success: result.changes > 0 };
  }

  /**
   * 更新记忆
   */
  async update(memoryId: string, updates: Partial<Memory>): Promise<{ success: boolean }> {
    const fields: string[] = [];
    const params: any[] = [];

    if (updates.content) {
      if (updates.content.summary) {
        fields.push('summary = ?');
        params.push(updates.content.summary);
      }
      if (updates.content.data !== undefined) {
        fields.push('data = ?');
        params.push(JSON.stringify(updates.content.data));
      }
    }

    if (updates.meta?.tags) {
      fields.push('tags = ?');
      params.push(JSON.stringify(updates.meta.tags));
    }

    if (updates.relations) {
      if (updates.relations.replaces) {
        fields.push('replaces = ?');
        params.push(JSON.stringify(updates.relations.replaces));
      }
      if (updates.relations.relatedTo) {
        fields.push('relatedTo = ?');
        params.push(JSON.stringify(updates.relations.relatedTo));
      }
      if (updates.relations.impacts) {
        fields.push('impacts = ?');
        params.push(JSON.stringify(updates.relations.impacts));
      }
      if (updates.relations.derivedFrom) {
        fields.push('derivedFrom = ?');
        params.push(updates.relations.derivedFrom);
      }
    }

    if (fields.length === 0) {
      return { success: false };
    }

    fields.push('updatedAt = ?');
    params.push(new Date().toISOString());
    params.push(memoryId);

    const sql = `UPDATE memories SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);

    // 失效相关缓存
    if (this.cache && result.changes > 0) {
      const memory = this.db.prepare('SELECT projectId FROM memories WHERE id = ?').get(memoryId) as {
        projectId: string;
      } | undefined;
      if (memory) {
        this.cache.invalidateProject(memory.projectId);
      }
    }

    return { success: result.changes > 0 };
  }

  /**
   * 根据 ID 获取单个记忆
   */
  async getById(id: string): Promise<Memory | null> {
    const stmt = this.db.prepare('SELECT * FROM memories WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToMemory(row) : null;
  }

  /**
   * 将数据库行转换为Memory对象
   */
  private rowToMemory(row: any): Memory {
    return {
      meta: {
        id: row.id,
        projectId: row.projectId,
        sessionId: row.sessionId,
        timestamp: row.timestamp,
        type: row.type as MemoryType,
        tags: row.tags ? JSON.parse(row.tags) : [],
        version: row.version,
      },
      content: {
        summary: row.summary,
        data: row.data ? JSON.parse(row.data) : {},
      },
      relations: {
        replaces: row.replaces ? JSON.parse(row.replaces) : undefined,
        relatedTo: row.relatedTo ? JSON.parse(row.relatedTo) : undefined,
        impacts: row.impacts ? JSON.parse(row.impacts) : undefined,
        derivedFrom: row.derivedFrom || undefined,
      },
      searchable: {
        keywords: row.keywords ? JSON.parse(row.keywords) : [],
        fullText: row.fullText,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
  }
}
