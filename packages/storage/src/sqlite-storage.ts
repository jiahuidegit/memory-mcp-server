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
  type Vector,
  type MemoryRelationData,
  type ProjectGroupConfig,
  serializeVector,
  deserializeVector,
  cosineSimilarity,
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
    data: Record<string, unknown>;
    rawContext: Record<string, unknown>;
    projectId: string;
    type?: MemoryType;
    tags?: string[];
    sessionId?: string;
    embedding?: Vector;
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
        context, keywords, fullText, embedding, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
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
      JSON.stringify(params.data), // data - 关键结构化数据（精简版）
      params.relations?.replaces ? JSON.stringify(params.relations.replaces) : null,
      params.relations?.relatedTo ? JSON.stringify(params.relations.relatedTo) : null,
      params.relations?.impacts ? JSON.stringify(params.relations.impacts) : null,
      params.relations?.derivedFrom || null,
      JSON.stringify(params.rawContext), // context - 完整原始数据（完整版）
      params.tags ? JSON.stringify(params.tags) : null, // keywords
      params.content, // fullText
      params.embedding ? serializeVector(params.embedding) : null, // embedding
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
      embedding?: Vector;
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
        context, keywords, fullText, embedding, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
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
      params.embedding ? serializeVector(params.embedding) : null,
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
      embedding?: Vector;
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
        context, keywords, fullText, embedding, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
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
      params.embedding ? serializeVector(params.embedding) : null,
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
      embedding?: Vector;
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
        context, keywords, fullText, embedding, createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
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
      params.embedding ? serializeVector(params.embedding) : null,
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
   * 检索记忆（新版多维度搜索 + 关系链融合）
   *
   * 搜索维度：
   * 1. projectId - 项目ID匹配（支持单个或多个）
   * 2. summary - 摘要文本搜索
   * 3. fullText - 全文搜索
   * 4. tags - 标签匹配
   * 5. keywords - 关键词匹配
   *
   * 核心功能：
   * - 多维度搜索
   * - 智能降级（无结果时自动放宽条件）
   * - 关系链融合（自动扩展关联记忆）
   */
  async recall(filters: SearchFilters): Promise<SearchResult> {
    const startTime = Date.now();

    // 检查缓存
    if (this.cache) {
      const cacheKey = LRUCache.generateKey(filters);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const strategy = filters.strategy || SearchStrategy.AUTO;
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;
    const expandRelations = filters.expandRelations !== false; // 默认开启
    const relationDepth = filters.relationDepth || 1;

    let actualStrategy: SearchStrategy;
    let results: Memory[];
    let total: number;
    let dbStartTime: number;
    let dbEndTime: number;

    const strategyStartTime = Date.now();

    // 语义搜索优先
    if (filters.queryVector && strategy !== SearchStrategy.EXACT && strategy !== SearchStrategy.FULLTEXT) {
      dbStartTime = Date.now();
      results = this.semanticSearch(filters, limit, offset);
      dbEndTime = Date.now();
      actualStrategy = SearchStrategy.SEMANTIC;
      total = results.length;
    }
    // 使用新的多维度搜索
    else {
      dbStartTime = Date.now();
      const searchResult = this.multiDimensionSearch(filters, limit, offset);
      results = searchResult.memories;
      total = searchResult.total;
      dbEndTime = Date.now();
      actualStrategy = SearchStrategy.FULLTEXT;

      // 智能降级：如果多维度搜索无结果
      if (results.length === 0 && filters.query) {
        // 降级1：只按 projectId 返回最近记忆
        if (filters.projectId || (filters.projectIds && filters.projectIds.length > 0)) {
          dbStartTime = Date.now();
          const degradedResult = this.multiDimensionSearch(
            { ...filters, query: undefined },
            limit,
            offset
          );
          results = degradedResult.memories;
          total = degradedResult.total;
          dbEndTime = Date.now();
        }

        // 降级2：全局搜索（移除 projectId 限制）
        if (results.length === 0) {
          dbStartTime = Date.now();
          const globalResult = this.multiDimensionSearch(
            { ...filters, projectId: undefined, projectIds: undefined },
            limit,
            offset
          );
          results = globalResult.memories;
          total = globalResult.total;
          dbEndTime = Date.now();
        }
      }

      // AUTO 模式：如果仍无结果且有向量，降级到语义搜索
      if (results.length === 0 && strategy === SearchStrategy.AUTO && filters.queryVector) {
        dbStartTime = Date.now();
        results = this.semanticSearch(filters, limit, offset);
        dbEndTime = Date.now();
        actualStrategy = SearchStrategy.SEMANTIC;
        total = results.length;
      }
    }

    // 关系链融合：扩展关联记忆
    let relatedMemories: Memory[] | undefined;
    if (expandRelations && results.length > 0) {
      relatedMemories = this.expandRelatedMemories(results, relationDepth);
    }

    const strategyTime = Date.now() - strategyStartTime;
    const took = Date.now() - startTime;
    const dbTime = dbEndTime - dbStartTime;
    const parseTime = took - dbTime - strategyTime;

    const result: SearchResult = {
      memories: results,
      relatedMemories,
      total,
      strategy: actualStrategy,
      took,
      metrics: {
        dbTime,
        parseTime: Math.max(0, parseTime),
        strategyTime,
        cacheHit: false,
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
   * 扩展关联记忆
   *
   * 基于搜索结果的关系链（relatedTo、replaces、impacts、derivedFrom）
   * 自动获取关联的记忆，去重后返回
   */
  private expandRelatedMemories(
    memories: Memory[],
    depth: number = 1
  ): Memory[] {
    if (depth <= 0 || memories.length === 0) {
      return [];
    }

    // 收集所有关联 ID（去重）
    const relatedIds = new Set<string>();
    const processedIds = new Set<string>(memories.map(m => m.meta.id));

    for (const memory of memories) {
      const { relations } = memory;
      if (!relations) continue;

      // 收集各种关系类型的 ID
      relations.relatedTo?.forEach(id => relatedIds.add(id));
      relations.replaces?.forEach(id => relatedIds.add(id));
      relations.impacts?.forEach(id => relatedIds.add(id));
      if (relations.derivedFrom) relatedIds.add(relations.derivedFrom);
    }

    // 过滤掉已经在主结果中的记忆
    const idsToFetch = Array.from(relatedIds).filter(id => !processedIds.has(id));

    if (idsToFetch.length === 0) {
      return [];
    }

    // 批量获取关联记忆
    const placeholders = idsToFetch.map(() => '?').join(', ');
    const sql = `SELECT * FROM memories WHERE id IN (${placeholders}) ORDER BY timestamp DESC`;
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...idsToFetch) as any[];

    const relatedMemories = rows.map(this.rowToMemory);

    // 递归扩展（如果需要更深层次）
    if (depth > 1 && relatedMemories.length > 0) {
      const deeperRelated = this.expandRelatedMemories(relatedMemories, depth - 1);
      // 合并并去重
      const allRelated = [...relatedMemories];
      const existingIds = new Set(allRelated.map(m => m.meta.id));
      for (const m of deeperRelated) {
        if (!existingIds.has(m.meta.id) && !processedIds.has(m.meta.id)) {
          allRelated.push(m);
          existingIds.add(m.meta.id);
        }
      }
      return allRelated;
    }

    return relatedMemories;
  }

  /**
   * 多维度搜索实现
   *
   * 搜索逻辑：
   * - projectId/projectIds: 项目过滤
   * - type: 类型过滤
   * - sessionId: 会话过滤
   * - tags: 标签过滤
   * - query: 多维度关键词搜索（projectId/summary/fullText/tags/keywords）
   */
  private multiDimensionSearch(
    filters: SearchFilters,
    limit: number,
    offset: number
  ): { memories: Memory[]; total: number } {
    let sql = 'SELECT * FROM memories WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM memories WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    // 1. 项目过滤（支持单个或多个）
    if (filters.projectIds && filters.projectIds.length > 0) {
      const placeholders = filters.projectIds.map(() => '?').join(', ');
      sql += ` AND projectId IN (${placeholders})`;
      countSql += ` AND projectId IN (${placeholders})`;
      params.push(...filters.projectIds);
      countParams.push(...filters.projectIds);
    } else if (filters.projectId) {
      sql += ' AND projectId = ?';
      countSql += ' AND projectId = ?';
      params.push(filters.projectId);
      countParams.push(filters.projectId);
    }

    // 2. 类型过滤
    if (filters.type) {
      sql += ' AND type = ?';
      countSql += ' AND type = ?';
      params.push(filters.type);
      countParams.push(filters.type);
    }

    // 3. 会话过滤
    if (filters.sessionId) {
      sql += ' AND sessionId = ?';
      countSql += ' AND sessionId = ?';
      params.push(filters.sessionId);
      countParams.push(filters.sessionId);
    }

    // 4. 标签过滤
    if (filters.tags && filters.tags.length > 0) {
      // SQLite 中 tags 是 JSON 字符串，使用 LIKE 匹配
      const tagConditions = filters.tags.map(() => 'tags LIKE ?').join(' OR ');
      sql += ` AND (${tagConditions})`;
      countSql += ` AND (${tagConditions})`;
      filters.tags.forEach(tag => {
        const pattern = `%"${tag}"%`;
        params.push(pattern);
        countParams.push(pattern);
      });
    }

    // 5. 多维度关键词搜索
    if (filters.query && filters.query.trim() !== '') {
      const keywords = filters.query.split(/\s+/).filter(k => k.length > 0);
      if (keywords.length > 0) {
        // 每个关键词在多个字段中匹配（OR 逻辑）
        const keywordConditions: string[] = [];
        keywords.forEach(keyword => {
          const pattern = `%${keyword}%`;
          // 搜索维度：projectId、summary、fullText、tags、keywords
          keywordConditions.push(
            '(projectId LIKE ? COLLATE NOCASE OR summary LIKE ? COLLATE NOCASE OR fullText LIKE ? COLLATE NOCASE OR tags LIKE ? COLLATE NOCASE OR keywords LIKE ? COLLATE NOCASE)'
          );
          params.push(pattern, pattern, pattern, pattern, pattern);
          countParams.push(pattern, pattern, pattern, pattern, pattern);
        });
        // 任一关键词匹配即可
        sql += ` AND (${keywordConditions.join(' OR ')})`;
        countSql += ` AND (${keywordConditions.join(' OR ')})`;
      }
    }

    // 排序和分页
    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // 执行查询
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    // 获取总数
    const countStmt = this.db.prepare(countSql);
    const countResult = countStmt.get(...countParams) as { total: number };

    return {
      memories: rows.map(this.rowToMemory),
      total: countResult.total,
    };
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
      // 将查询字符串按空格拆分为多个关键词，任一匹配即可
      const keywords = filters.query.split(/\s+/).filter(k => k.length > 0);
      if (keywords.length === 1) {
        sql += ' AND (summary LIKE ? OR fullText LIKE ?)';
        params.push(`%${keywords[0]}%`, `%${keywords[0]}%`);
      } else {
        // 多个关键词：OR 逻辑
        const conditions = keywords.map(() => '(summary LIKE ? OR fullText LIKE ?)').join(' OR ');
        sql += ` AND (${conditions})`;
        keywords.forEach(keyword => {
          params.push(`%${keyword}%`, `%${keyword}%`);
        });
      }
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map(this.rowToMemory);
  }

  /**
   * L3: 语义搜索（向量相似度）
   * 基于 cosine similarity 进行向量检索
   */
  private semanticSearch(filters: SearchFilters, limit: number, offset: number): Memory[] {
    if (!filters.queryVector) {
      return [];
    }

    const threshold = filters.similarityThreshold ?? 0.7;

    // 构建基础查询（只取有 embedding 的记录）
    let sql = 'SELECT * FROM memories WHERE embedding IS NOT NULL';
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

    sql += ' ORDER BY timestamp DESC';

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    // 计算相似度并过滤
    const queryVector = filters.queryVector;
    const scoredResults: { row: any; similarity: number }[] = [];

    for (const row of rows) {
      try {
        const storedVector = deserializeVector(row.embedding);
        const similarity = cosineSimilarity(queryVector, storedVector);

        // 只保留超过阈值的结果
        if (similarity >= threshold) {
          scoredResults.push({ row, similarity });
        }
      } catch {
        // 向量解析失败，跳过
        continue;
      }
    }

    // 按相似度降序排序
    scoredResults.sort((a, b) => b.similarity - a.similarity);

    // 应用分页
    const paginatedResults = scoredResults.slice(offset, offset + limit);

    return paginatedResults.map((item) => this.rowToMemory(item.row));
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
    // 解析 context 字段（包含完整原始数据）
    const rawContext = row.context ? JSON.parse(row.context) : undefined;

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
        // 返回完整原始上下文，保留所有细节
        rawContext,
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

  /**
   * 获取统计信息
   */
  async getStats(projectId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byProject: Record<string, number>;
    recentCount: number;
  }> {
    // 总数查询
    let totalSql = 'SELECT COUNT(*) as count FROM memories';
    const totalParams: any[] = [];
    if (projectId) {
      totalSql += ' WHERE projectId = ?';
      totalParams.push(projectId);
    }
    const totalResult = this.db.prepare(totalSql).get(...totalParams) as { count: number };

    // 按类型统计
    let typeSql = 'SELECT type, COUNT(*) as count FROM memories';
    const typeParams: any[] = [];
    if (projectId) {
      typeSql += ' WHERE projectId = ?';
      typeParams.push(projectId);
    }
    typeSql += ' GROUP BY type';
    const typeResults = this.db.prepare(typeSql).all(...typeParams) as { type: string; count: number }[];
    const byType: Record<string, number> = {};
    typeResults.forEach((row) => {
      byType[row.type] = row.count;
    });

    // 按项目统计
    let projectSql = 'SELECT projectId, COUNT(*) as count FROM memories GROUP BY projectId';
    if (projectId) {
      projectSql = 'SELECT projectId, COUNT(*) as count FROM memories WHERE projectId = ? GROUP BY projectId';
    }
    const projectResults = this.db.prepare(projectSql).all(...(projectId ? [projectId] : [])) as { projectId: string; count: number }[];
    const byProject: Record<string, number> = {};
    projectResults.forEach((row) => {
      byProject[row.projectId] = row.count;
    });

    // 最近 7 天统计
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    let recentSql = 'SELECT COUNT(*) as count FROM memories WHERE timestamp >= ?';
    const recentParams: any[] = [sevenDaysAgo.toISOString()];
    if (projectId) {
      recentSql += ' AND projectId = ?';
      recentParams.push(projectId);
    }
    const recentResult = this.db.prepare(recentSql).get(...recentParams) as { count: number };

    return {
      total: totalResult.count,
      byType,
      byProject,
      recentCount: recentResult.count,
    };
  }

  // ========== 项目组管理 ==========

  /**
   * 创建或更新项目组
   */
  async setProjectGroup(group: ProjectGroupConfig): Promise<{ success: boolean }> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO project_groups (id, name, projects, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        projects = excluded.projects,
        updatedAt = excluded.updatedAt
    `);

    stmt.run(
      `pg_${nanoid()}`,
      group.name,
      JSON.stringify(group.projects),
      now,
      now
    );

    return { success: true };
  }

  /**
   * 获取项目组
   */
  async getProjectGroup(name: string): Promise<ProjectGroupConfig | null> {
    const stmt = this.db.prepare('SELECT * FROM project_groups WHERE name = ?');
    const row = stmt.get(name) as any;

    if (!row) return null;

    return {
      name: row.name,
      projects: JSON.parse(row.projects),
    };
  }

  /**
   * 获取项目所属的项目组
   */
  async getProjectGroupByProject(projectId: string): Promise<ProjectGroupConfig | null> {
    const stmt = this.db.prepare('SELECT * FROM project_groups');
    const rows = stmt.all() as any[];

    for (const row of rows) {
      const projects = JSON.parse(row.projects) as string[];
      if (projects.includes(projectId)) {
        return {
          name: row.name,
          projects,
        };
      }
    }

    return null;
  }

  /**
   * 获取所有项目组
   */
  async getAllProjectGroups(): Promise<ProjectGroupConfig[]> {
    const stmt = this.db.prepare('SELECT * FROM project_groups');
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      name: row.name,
      projects: JSON.parse(row.projects),
    }));
  }

  /**
   * 删除项目组
   */
  async deleteProjectGroup(name: string): Promise<{ success: boolean }> {
    const stmt = this.db.prepare('DELETE FROM project_groups WHERE name = ?');
    const result = stmt.run(name);
    return { success: result.changes > 0 };
  }

  // ========== 记忆关系管理 ==========

  /**
   * 批量创建记忆关系
   */
  async createRelations(relations: MemoryRelationData[]): Promise<{ success: boolean; count: number }> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO memory_relations (id, sourceId, targetId, type, confidence, isAutoGenerated, reason, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const rel of relations) {
      const result = stmt.run(
        `rel_${nanoid()}`,
        rel.sourceId,
        rel.targetId,
        rel.type,
        rel.confidence,
        rel.isAutoGenerated ? 1 : 0,
        rel.reason || null,
        now
      );
      if (result.changes > 0) count++;
    }

    return { success: true, count };
  }

  /**
   * 获取记忆的所有关系
   */
  async getMemoryRelations(
    memoryId: string,
    options?: {
      includeAutoGenerated?: boolean;
      type?: 'relatedTo' | 'replaces' | 'impacts';
    }
  ): Promise<MemoryRelationData[]> {
    let sql = 'SELECT * FROM memory_relations WHERE (sourceId = ? OR targetId = ?)';
    const params: any[] = [memoryId, memoryId];

    if (options?.includeAutoGenerated === false) {
      sql += ' AND isAutoGenerated = 0';
    }

    if (options?.type) {
      sql += ' AND type = ?';
      params.push(options.type);
    }

    sql += ' ORDER BY createdAt DESC';

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      sourceId: row.sourceId,
      targetId: row.targetId,
      type: row.type,
      confidence: row.confidence,
      isAutoGenerated: row.isAutoGenerated === 1,
      reason: row.reason,
    }));
  }

  /**
   * 删除记忆关系
   */
  async deleteRelation(sourceId: string, targetId: string, type?: string): Promise<{ success: boolean }> {
    let sql = 'DELETE FROM memory_relations WHERE sourceId = ? AND targetId = ?';
    const params: any[] = [sourceId, targetId];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return { success: result.changes > 0 };
  }

  /**
   * 搜索候选关联记忆（用于自动关联）
   */
  async searchCandidates(params: {
    keywords: string[];
    projectIds: string[];
    excludeId?: string;
    limit?: number;
  }): Promise<Memory[]> {
    if (params.keywords.length === 0 || params.projectIds.length === 0) {
      return [];
    }

    const limit = params.limit || 50;

    // 构建 SQL：在指定项目中搜索包含任一关键词的记忆
    let sql = 'SELECT * FROM memories WHERE 1=1';
    const sqlParams: any[] = [];

    // 项目过滤
    const projectPlaceholders = params.projectIds.map(() => '?').join(', ');
    sql += ` AND projectId IN (${projectPlaceholders})`;
    sqlParams.push(...params.projectIds);

    // 排除自身
    if (params.excludeId) {
      sql += ' AND id != ?';
      sqlParams.push(params.excludeId);
    }

    // 关键词匹配（OR 逻辑）
    const keywordConditions = params.keywords.map(() => '(summary LIKE ? OR fullText LIKE ? OR keywords LIKE ?)').join(' OR ');
    sql += ` AND (${keywordConditions})`;
    params.keywords.forEach(keyword => {
      const pattern = `%${keyword}%`;
      sqlParams.push(pattern, pattern, pattern);
    });

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    sqlParams.push(limit);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...sqlParams) as any[];

    return rows.map(this.rowToMemory);
  }
}
