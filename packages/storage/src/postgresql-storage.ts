import { PrismaClient, Prisma } from '@prisma/client';
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
import { LRUCache } from './cache.js';

/**
 * PostgreSQL存储实现（云版）
 * 使用Prisma ORM + PostgreSQL全文搜索
 */
export class PostgreSQLStorage implements IStorage {
  private prisma: PrismaClient;
  private cache: LRUCache | null;

  constructor(databaseUrl?: string, options?: { enableCache?: boolean; cacheSize?: number }) {
    this.prisma = new PrismaClient({
      datasources: databaseUrl
        ? {
            db: { url: databaseUrl },
          }
        : undefined,
    });

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
    const timestamp = new Date();
    const memoryType = params.type || MemoryType.CODE;

    await this.prisma.memory.create({
      data: {
        id,
        projectId: params.projectId,
        sessionId: params.sessionId || null,
        timestamp,
        type: memoryType,
        tags: params.tags || [],
        summary: params.content,
        data: params.rawContext as any,
        replaces: params.relations?.replaces || [],
        relatedTo: params.relations?.relatedTo || [],
        impacts: params.relations?.impacts || [],
        derivedFrom: params.relations?.derivedFrom || null,
        context: params.rawContext as any,
        keywords: params.tags || [],
        fullText: params.content,
      },
    });

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
    const timestamp = new Date();
    const summary = `[决策] ${params.question}`;
    const fullText = `${params.question} ${params.options.map((o) => o.name).join(' ')} ${params.reason}`;
    const keywords = [...(params.tags || []), ...params.options.map((o) => o.name), params.chosen];

    await this.prisma.memory.create({
      data: {
        id,
        projectId: params.projectId,
        sessionId: params.sessionId || null,
        timestamp,
        type: MemoryType.DECISION,
        tags: params.tags || [],
        summary,
        data: {},
        replaces: params.relations?.replaces || [],
        relatedTo: params.relations?.relatedTo || [],
        impacts: params.relations?.impacts || [],
        derivedFrom: params.relations?.derivedFrom || null,
        context: {
          question: params.question,
          analysis: params.analysis,
          options: params.options,
          chosen: params.chosen,
          reason: params.reason,
        } as any,
        keywords,
        fullText,
      },
    });

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
    const timestamp = new Date();
    const summary = `[方案] ${params.problem}`;
    const fullText = `${params.problem} ${params.rootCause} ${params.solution} ${params.prevention || ''} ${params.relatedIssues?.join(' ') || ''}`;
    const keywords = [...(params.tags || []), ...(params.relatedIssues || [])];

    await this.prisma.memory.create({
      data: {
        id,
        projectId: params.projectId,
        sessionId: params.sessionId || null,
        timestamp,
        type: MemoryType.SOLUTION,
        tags: params.tags || [],
        summary,
        data: (params.artifacts || {}) as any,
        replaces: params.relations?.replaces || [],
        relatedTo: params.relations?.relatedTo || [],
        impacts: params.relations?.impacts || [],
        derivedFrom: params.relations?.derivedFrom || null,
        context: {
          problem: params.problem,
          rootCause: params.rootCause,
          solution: params.solution,
          prevention: params.prevention,
          relatedIssues: params.relatedIssues,
        } as any,
        keywords,
        fullText,
      },
    });

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
    const timestamp = new Date();
    const summary = `[会话] ${params.summary}`;
    const fullText = `${params.summary} ${params.decisions?.join(' ') || ''} ${params.unfinishedTasks?.join(' ') || ''} ${params.nextSteps?.join(' ') || ''}`;
    const keywords = [...(params.decisions || []), ...(params.unfinishedTasks || [])];

    await this.prisma.memory.create({
      data: {
        id,
        projectId: params.projectId,
        sessionId: params.sessionId || id,
        timestamp,
        type: MemoryType.SESSION,
        tags: [],
        summary,
        data: {},
        replaces: [],
        relatedTo: [],
        impacts: [],
        derivedFrom: null,
        context: {
          summary: params.summary,
          decisions: params.decisions,
          unfinishedTasks: params.unfinishedTasks,
          nextSteps: params.nextSteps,
        } as any,
        keywords,
        fullText,
      },
    });

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
    let total: number;
    let dbStartTime: number;
    let dbEndTime: number;

    // 策略选择
    const strategyStartTime = Date.now();

    // L1: 精确匹配（优先）
    if (strategy === SearchStrategy.EXACT || strategy === SearchStrategy.AUTO) {
      dbStartTime = Date.now();
      const searchResult = await this.exactSearchWithCount(filters, limit, offset);
      results = searchResult.memories;
      total = searchResult.total;
      dbEndTime = Date.now();
      actualStrategy = SearchStrategy.EXACT;

      // 如果L1找不到结果，降级到L2全文搜索
      if (results.length === 0 && strategy === SearchStrategy.AUTO) {
        dbStartTime = Date.now();
        const fulltextResult = await this.fulltextSearchWithCount(filters, limit, offset);
        results = fulltextResult.memories;
        total = fulltextResult.total;
        dbEndTime = Date.now();
        actualStrategy = SearchStrategy.FULLTEXT;
      }
    }
    // L2: 全文搜索
    else if (strategy === SearchStrategy.FULLTEXT) {
      dbStartTime = Date.now();
      const searchResult = await this.fulltextSearchWithCount(filters, limit, offset);
      results = searchResult.memories;
      total = searchResult.total;
      dbEndTime = Date.now();
      actualStrategy = SearchStrategy.FULLTEXT;
    }
    // L3: 语义检索（暂未实现）
    else {
      dbStartTime = Date.now();
      const searchResult = await this.fulltextSearchWithCount(filters, limit, offset);
      results = searchResult.memories;
      total = searchResult.total;
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
      total, // 返回真正的总数
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
   * L1: 精确匹配检索（带总数）
   */
  private async exactSearchWithCount(
    filters: SearchFilters,
    limit: number,
    offset: number
  ): Promise<{ memories: Memory[]; total: number }> {
    const where: Prisma.MemoryWhereInput = {};

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.sessionId) {
      where.sessionId = filters.sessionId;
    }

    if (filters.query) {
      // 将查询字符串按空格拆分为多个关键词，任一匹配即可
      const keywords = filters.query.split(/\s+/).filter(k => k.length > 0);
      if (keywords.length === 1) {
        where.OR = [
          { summary: { contains: keywords[0], mode: 'insensitive' } },
          { fullText: { contains: keywords[0], mode: 'insensitive' } },
        ];
      } else {
        where.OR = keywords.flatMap(keyword => [
          { summary: { contains: keyword, mode: 'insensitive' } },
          { fullText: { contains: keyword, mode: 'insensitive' } },
        ]);
      }
    }

    // 并行执行查询和计数
    const [rows, total] = await Promise.all([
      this.prisma.memory.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.memory.count({ where }),
    ]);

    return { memories: rows.map(this.rowToMemory), total };
  }

  /**
   * L1: 精确匹配检索
   */
  private async exactSearch(
    filters: SearchFilters,
    limit: number,
    offset: number
  ): Promise<Memory[]> {
    const result = await this.exactSearchWithCount(filters, limit, offset);
    return result.memories;
  }

  /**
   * L2: 全文搜索（PostgreSQL，带总数）
   */
  private async fulltextSearchWithCount(
    filters: SearchFilters,
    limit: number,
    offset: number
  ): Promise<{ memories: Memory[]; total: number }> {
    // 使用PostgreSQL的ILIKE进行简单全文搜索
    const where: Prisma.MemoryWhereInput = {};

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.sessionId) {
      where.sessionId = filters.sessionId;
    }

    if (filters.query) {
      // 将查询字符串按空格拆分为多个关键词，任一匹配即可
      const keywords = filters.query.split(/\s+/).filter(k => k.length > 0);
      if (keywords.length === 1) {
        where.OR = [
          { summary: { contains: keywords[0], mode: 'insensitive' } },
          { fullText: { contains: keywords[0], mode: 'insensitive' } },
        ];
      } else {
        where.OR = keywords.flatMap(keyword => [
          { summary: { contains: keyword, mode: 'insensitive' } },
          { fullText: { contains: keyword, mode: 'insensitive' } },
        ]);
      }
    }

    // 并行执行查询和计数
    const [rows, total] = await Promise.all([
      this.prisma.memory.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.memory.count({ where }),
    ]);

    return { memories: rows.map(this.rowToMemory), total };
  }

  /**
   * L2: 全文搜索（PostgreSQL）
   */
  private async fulltextSearch(
    filters: SearchFilters,
    limit: number,
    offset: number
  ): Promise<Memory[]> {
    const result = await this.fulltextSearchWithCount(filters, limit, offset);
    return result.memories;
  }

  /**
   * 获取时间线
   */
  async getTimeline(options: TimelineOptions): Promise<TimelineResult> {
    const where: Prisma.MemoryWhereInput = {
      projectId: options.projectId,
    };

    if (options.type) {
      where.type = options.type;
    }

    if (options.dateRange) {
      where.timestamp = {
        gte: new Date(options.dateRange[0]),
        lte: new Date(options.dateRange[1]),
      };
    }

    const memories = await this.prisma.memory.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options.limit,
      skip: options.offset,
    });

    const converted = memories.map(this.rowToMemory);

    const entries: TimelineEntry[] = converted.map((memory, index) => ({
      memory,
      prevMemoryId: index > 0 ? converted[index - 1].meta.id : undefined,
      nextMemoryId: index < converted.length - 1 ? converted[index + 1].meta.id : undefined,
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
    const memory = await this.getMemoryById(options.memoryId);
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
        const relatedMemory = await this.getMemoryById(relatedId);
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
   * 根据 ID 获取单个记忆
   */
  async getById(id: string): Promise<Memory | null> {
    const row = await this.prisma.memory.findUnique({
      where: { id },
    });
    return row ? this.rowToMemory(row) : null;
  }

  /**
   * 删除记忆
   */
  async delete(memoryId: string): Promise<{ success: boolean }> {
    try {
      // 先查询 projectId 用于缓存失效
      if (this.cache) {
        const memory = await this.prisma.memory.findUnique({
          where: { id: memoryId },
          select: { projectId: true },
        });
        if (memory) {
          this.cache.invalidateProject(memory.projectId);
        }
      }

      await this.prisma.memory.delete({
        where: { id: memoryId },
      });
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * 更新记忆
   */
  async update(memoryId: string, updates: Partial<Memory>): Promise<{ success: boolean }> {
    try {
      const data: Prisma.MemoryUpdateInput = {};

      if (updates.content) {
        if (updates.content.summary) {
          data.summary = updates.content.summary;
        }
        if (updates.content.data !== undefined) {
          data.data = updates.content.data as any;
        }
      }

      if (updates.meta?.tags) {
        data.tags = updates.meta.tags;
      }

      if (updates.relations) {
        if (updates.relations.replaces) {
          data.replaces = updates.relations.replaces;
        }
        if (updates.relations.relatedTo) {
          data.relatedTo = updates.relations.relatedTo;
        }
        if (updates.relations.impacts) {
          data.impacts = updates.relations.impacts;
        }
        if (updates.relations.derivedFrom) {
          data.derivedFrom = updates.relations.derivedFrom;
        }
      }

      if (Object.keys(data).length === 0) {
        return { success: false };
      }

      await this.prisma.memory.update({
        where: { id: memoryId },
        data,
      });

      // 失效相关缓存
      if (this.cache) {
        const memory = await this.prisma.memory.findUnique({
          where: { id: memoryId },
          select: { projectId: true },
        });
        if (memory) {
          this.cache.invalidateProject(memory.projectId);
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * 根据ID获取记忆
   */
  private async getMemoryById(id: string): Promise<Memory | null> {
    const row = await this.prisma.memory.findUnique({
      where: { id },
    });
    return row ? this.rowToMemory(row) : null;
  }

  /**
   * 将Prisma行转换为Memory对象
   */
  private rowToMemory(row: any): Memory {
    return {
      meta: {
        id: row.id,
        projectId: row.projectId,
        sessionId: row.sessionId,
        timestamp: row.timestamp.toISOString(),
        type: row.type as MemoryType,
        tags: row.tags || [],
        version: row.version,
      },
      content: {
        summary: row.summary,
        data: (row.data || {}) as Record<string, unknown>,
        // 返回完整原始上下文，保留所有细节
        rawContext: row.context as Record<string, unknown> | undefined,
      },
      relations: {
        replaces: row.replaces || undefined,
        relatedTo: row.relatedTo || undefined,
        impacts: row.impacts || undefined,
        derivedFrom: row.derivedFrom || undefined,
      },
      searchable: {
        keywords: row.keywords || [],
        fullText: row.fullText,
      },
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
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
    // 构建基础查询条件
    const baseWhere: Prisma.MemoryWhereInput = projectId ? { projectId } : {};

    // 并行执行所有统计查询
    const [totalCount, typeStats, projectStats, recentCount] = await Promise.all([
      // 总数
      this.prisma.memory.count({ where: baseWhere }),

      // 按类型统计
      this.prisma.memory.groupBy({
        by: ['type'],
        where: baseWhere,
        _count: { type: true },
      }),

      // 按项目统计
      this.prisma.memory.groupBy({
        by: ['projectId'],
        where: baseWhere,
        _count: { projectId: true },
      }),

      // 最近 7 天统计
      this.prisma.memory.count({
        where: {
          ...baseWhere,
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // 转换按类型统计结果
    const byType: Record<string, number> = {};
    typeStats.forEach((row) => {
      byType[row.type] = row._count.type;
    });

    // 转换按项目统计结果
    const byProject: Record<string, number> = {};
    projectStats.forEach((row) => {
      byProject[row.projectId] = row._count.projectId;
    });

    return {
      total: totalCount,
      byType,
      byProject,
      recentCount,
    };
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
