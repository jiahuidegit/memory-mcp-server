import { MemoryType, SearchStrategy } from './types.js';
import {
  Memory,
  DecisionMemory,
  SolutionMemory,
  SessionMemory,
  DecisionContext,
  SolutionContext,
  SessionContext,
} from './memory.js';
import type { Vector } from './embedding.js';
import type { MemoryRelationData, ProjectGroupConfig } from './auto-relation.js';

/**
 * 检索过滤条件
 */
export interface SearchFilters {
  /** 查询关键词（可选，为空时返回所有记忆） */
  query?: string;
  /** 查询向量（用于语义搜索） */
  queryVector?: Vector;
  /** 项目ID（可选） */
  projectId?: string;
  /** 项目列表（跨项目搜索） */
  projectIds?: string[];
  /** 记忆类型（可选） */
  type?: MemoryType;
  /** 标签过滤（可选） */
  tags?: string[];
  /** 会话ID（可选） */
  sessionId?: string;
  /** 检索策略 */
  strategy?: SearchStrategy;
  /** 语义搜索相似度阈值（0-1，默认 0.7） */
  similarityThreshold?: number;
  /** 分页：每页数量 */
  limit?: number;
  /** 分页：偏移量 */
  offset?: number;
  /** 是否自动扩展关系链（默认 true） */
  expandRelations?: boolean;
  /** 关系链扩展深度（默认 1） */
  relationDepth?: number;
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** 数据库查询时间（ms） */
  dbTime: number;
  /** 结果解析时间（ms） */
  parseTime: number;
  /** 策略选择时间（ms） */
  strategyTime?: number;
  /** 缓存命中标识 */
  cacheHit?: boolean;
}

/**
 * 检索结果
 */
export interface SearchResult {
  /** 匹配的记忆列表 */
  memories: Memory[];
  /** 关联的记忆列表（通过关系链扩展） */
  relatedMemories?: Memory[];
  /** 总数 */
  total: number;
  /** 实际使用的检索策略 */
  strategy: SearchStrategy;
  /** 查询耗时（ms） */
  took: number;
  /** 建议（查询失败时） */
  suggestions?: string[];
  /** 性能指标（可选） */
  metrics?: PerformanceMetrics;
  /** 搜索的项目列表 */
  projectsSearched?: string[];
}

/**
 * 时间线选项
 */
export interface TimelineOptions {
  /** 项目ID */
  projectId: string;
  /** 日期范围（可选） */
  dateRange?: [string, string];
  /** 类型过滤（可选） */
  type?: MemoryType;
  /** 分页：每页数量 */
  limit?: number;
  /** 分页：偏移量 */
  offset?: number;
}

/**
 * 时间线条目
 */
export interface TimelineEntry {
  /** 记忆 */
  memory: Memory;
  /** 上一条记忆ID */
  prevMemoryId?: string;
  /** 下一条记忆ID */
  nextMemoryId?: string;
}

/**
 * 时间线结果
 */
export interface TimelineResult {
  /** 时间线条目 */
  entries: TimelineEntry[];
  /** 总数 */
  total: number;
}

/**
 * 关系链节点
 */
export interface RelationNode {
  /** 记忆 */
  memory: Memory;
  /** 关联的记忆节点 */
  related?: RelationNode[];
}

/**
 * 关系链查询选项
 */
export interface RelationsOptions {
  /** 记忆ID */
  memoryId: string;
  /** 深度（默认1） */
  depth?: number;
}

/**
 * 存储接口
 */
export interface IStorage {
  /**
   * 通用存储
   */
  store(params: {
    content: string;
    data: Record<string, unknown>;
    rawContext: Record<string, unknown>;
    projectId: string;
    type?: MemoryType;
    tags?: string[];
    sessionId?: string;
    embedding?: Vector; // 可选的向量 embedding
    relations?: {
      replaces?: string[];
      relatedTo?: string[];
      impacts?: string[];
      derivedFrom?: string;
    };
  }): Promise<{ id: string; success: boolean }>;

  /**
   * 存储决策
   */
  storeDecision(
    params: DecisionContext & {
      projectId: string;
      tags?: string[];
      sessionId?: string;
      embedding?: Vector; // 可选的向量 embedding
      relations?: {
        replaces?: string[];
        relatedTo?: string[];
        impacts?: string[];
        derivedFrom?: string;
      };
    }
  ): Promise<{ id: string; success: boolean }>;

  /**
   * 存储解决方案
   */
  storeSolution(
    params: SolutionContext & {
      projectId: string;
      tags?: string[];
      sessionId?: string;
      embedding?: Vector; // 可选的向量 embedding
      artifacts?: Record<string, string>;
      relations?: {
        replaces?: string[];
        relatedTo?: string[];
        impacts?: string[];
        derivedFrom?: string;
      };
    }
  ): Promise<{ id: string; success: boolean }>;

  /**
   * 存储会话
   */
  storeSession(
    params: SessionContext & {
      projectId: string;
      sessionId?: string;
      embedding?: Vector; // 可选的向量 embedding
    }
  ): Promise<{ id: string; success: boolean }>;

  /**
   * 检索记忆
   */
  recall(filters: SearchFilters): Promise<SearchResult>;

  /**
   * 获取时间线
   */
  getTimeline(options: TimelineOptions): Promise<TimelineResult>;

  /**
   * 获取关系链
   */
  getRelations(options: RelationsOptions): Promise<RelationNode>;

  /**
   * 根据 ID 获取单个记忆
   */
  getById(id: string): Promise<Memory | null>;

  /**
   * 删除记忆
   */
  delete(memoryId: string): Promise<{ success: boolean }>;

  /**
   * 更新记忆
   */
  update(memoryId: string, updates: Partial<Memory>): Promise<{ success: boolean }>;

  /**
   * 获取统计信息（可选实现）
   */
  getStats?(projectId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byProject: Record<string, number>;
    recentCount: number; // 最近 7 天
  }>;

  // ========== 项目组管理 ==========

  /**
   * 创建或更新项目组
   */
  setProjectGroup?(group: ProjectGroupConfig): Promise<{ success: boolean }>;

  /**
   * 获取项目组
   */
  getProjectGroup?(name: string): Promise<ProjectGroupConfig | null>;

  /**
   * 获取项目所属的项目组
   */
  getProjectGroupByProject?(projectId: string): Promise<ProjectGroupConfig | null>;

  /**
   * 获取所有项目组
   */
  getAllProjectGroups?(): Promise<ProjectGroupConfig[]>;

  /**
   * 删除项目组
   */
  deleteProjectGroup?(name: string): Promise<{ success: boolean }>;

  // ========== 记忆关系管理 ==========

  /**
   * 批量创建记忆关系
   */
  createRelations?(relations: MemoryRelationData[]): Promise<{ success: boolean; count: number }>;

  /**
   * 获取记忆的所有关系（包括自动生成的）
   */
  getMemoryRelations?(memoryId: string, options?: {
    includeAutoGenerated?: boolean;
    type?: 'relatedTo' | 'replaces' | 'impacts';
  }): Promise<MemoryRelationData[]>;

  /**
   * 删除记忆关系
   */
  deleteRelation?(sourceId: string, targetId: string, type?: string): Promise<{ success: boolean }>;

  /**
   * 搜索候选关联记忆（用于自动关联）
   */
  searchCandidates?(params: {
    keywords: string[];
    projectIds: string[];
    excludeId?: string;
    limit?: number;
  }): Promise<Memory[]>;
}
