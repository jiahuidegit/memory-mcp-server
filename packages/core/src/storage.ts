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

/**
 * 检索过滤条件
 */
export interface SearchFilters {
  /** 查询关键词（可选，为空时返回所有记忆） */
  query?: string;
  /** 项目ID（可选） */
  projectId?: string;
  /** 记忆类型（可选） */
  type?: MemoryType;
  /** 标签过滤（可选） */
  tags?: string[];
  /** 会话ID（可选） */
  sessionId?: string;
  /** 检索策略 */
  strategy?: SearchStrategy;
  /** 分页：每页数量 */
  limit?: number;
  /** 分页：偏移量 */
  offset?: number;
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
  }): Promise<{ id: string; success: boolean }>;

  /**
   * 存储决策
   */
  storeDecision(
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
  ): Promise<{ id: string; success: boolean }>;

  /**
   * 存储解决方案
   */
  storeSolution(
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
  ): Promise<{ id: string; success: boolean }>;

  /**
   * 存储会话
   */
  storeSession(
    params: SessionContext & {
      projectId: string;
      sessionId?: string;
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
}
