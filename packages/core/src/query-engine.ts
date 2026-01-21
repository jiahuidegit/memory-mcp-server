/**
 * 智能查询引擎
 *
 * 设计目标：
 * 1. 多维度搜索 - 搜索 projectId、summary、fullText、tags、keywords
 * 2. 关系链融合 - 查询时自动扩展关联记忆
 * 3. 项目组扩展 - 自动搜索同项目组的记忆
 * 4. 智能降级 - 无结果时自动放宽条件
 * 5. 相关性排序 - 按多维度相关性分数排序
 */

import type { Memory } from './memory.js';
import type { MemoryType, SearchStrategy } from './types.js';

/**
 * 查询意图类型
 */
export enum QueryIntent {
  /** 恢复项目上下文 */
  PROJECT_CONTEXT = 'project_context',
  /** 搜索特定话题 */
  TOPIC_SEARCH = 'topic_search',
  /** 全局搜索 */
  GLOBAL_SEARCH = 'global_search',
  /** 继续上次会话 */
  RESUME_SESSION = 'resume_session',
}

/**
 * 查询请求
 */
export interface QueryRequest {
  /** 原始查询文本 */
  query: string;
  /** 项目 ID（可选） */
  projectId?: string;
  /** 记忆类型过滤 */
  type?: MemoryType;
  /** 标签过滤 */
  tags?: string[];
  /** 会话 ID */
  sessionId?: string;
  /** 返回数量限制 */
  limit?: number;
  /** 是否扩展关系链（默认 true） */
  expandRelations?: boolean;
  /** 关系链深度（默认 1） */
  relationDepth?: number;
  /** 是否扩展项目组（默认 true） */
  expandProjectGroup?: boolean;
}

/**
 * 搜索匹配项
 */
export interface SearchMatch {
  /** 记忆 */
  memory: Memory;
  /** 相关性分数 (0-1) */
  score: number;
  /** 匹配来源 */
  matchSources: MatchSource[];
  /** 是否通过关系链找到 */
  isRelated?: boolean;
  /** 关系类型（如果是关联记忆） */
  relationType?: string;
}

/**
 * 匹配来源
 */
export interface MatchSource {
  /** 匹配字段 */
  field: 'projectId' | 'summary' | 'fullText' | 'tags' | 'keywords' | 'relation';
  /** 匹配的关键词 */
  keyword: string;
  /** 字段权重 */
  weight: number;
}

/**
 * 查询结果
 */
export interface QueryResult {
  /** 直接匹配的记忆（按相关性排序） */
  memories: SearchMatch[];
  /** 通过关系链扩展的记忆 */
  relatedMemories: SearchMatch[];
  /** 总数 */
  total: number;
  /** 查询意图 */
  intent: QueryIntent;
  /** 实际搜索的项目列表 */
  projectsSearched: string[];
  /** 是否触发了降级 */
  degraded: boolean;
  /** 降级原因（如果有） */
  degradeReason?: string;
  /** 查询耗时 (ms) */
  took: number;
  /** 建议（无结果时） */
  suggestions?: string[];
}

/**
 * 字段搜索权重配置
 */
export const FIELD_WEIGHTS = {
  projectId: 1.0,    // 项目 ID 完全匹配权重最高
  tags: 0.9,         // 标签匹配权重次之
  keywords: 0.8,     // 关键词匹配
  summary: 0.7,      // 摘要匹配
  fullText: 0.5,     // 全文匹配权重较低
  relation: 0.6,     // 关系链匹配
} as const;

/**
 * 分析查询意图
 */
export function analyzeQueryIntent(request: QueryRequest): QueryIntent {
  const { query, projectId, sessionId } = request;
  const lowerQuery = query.toLowerCase();

  // 继续会话
  if (sessionId || /继续|上次|之前|昨天/.test(lowerQuery)) {
    return QueryIntent.RESUME_SESSION;
  }

  // 项目上下文恢复
  if (projectId && (!query || query.trim() === '')) {
    return QueryIntent.PROJECT_CONTEXT;
  }

  // 全局搜索
  if (!projectId && query) {
    return QueryIntent.GLOBAL_SEARCH;
  }

  // 话题搜索
  return QueryIntent.TOPIC_SEARCH;
}

/**
 * 提取查询关键词
 */
export function extractQueryKeywords(query: string): string[] {
  if (!query || query.trim() === '') {
    return [];
  }

  // 按空格分割，过滤掉常见停用词
  const stopWords = new Set([
    '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
    '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
    '这', '那', '什么', '怎么', '哪', '为什么', '如何', '继续', '讨论', '项目',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'about', 'this', 'that', 'these', 'those',
  ]);

  const words = query
    .split(/[\s,，。！？!?、；;：:]+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0 && !stopWords.has(w));

  return [...new Set(words)];
}

/**
 * 计算单条记忆的相关性分数
 */
export function calculateRelevanceScore(
  memory: Memory,
  keywords: string[],
  projectId?: string
): { score: number; sources: MatchSource[] } {
  if (keywords.length === 0 && !projectId) {
    // 无查询条件，返回基于时间的分数
    const age = Date.now() - new Date(memory.createdAt || memory.meta?.timestamp || 0).getTime();
    const daysSinceCreated = age / (1000 * 60 * 60 * 24);
    // 越新的记忆分数越高
    const timeScore = Math.max(0, 1 - daysSinceCreated / 30);
    return { score: timeScore, sources: [] };
  }

  const sources: MatchSource[] = [];
  let totalScore = 0;

  // 1. projectId 匹配
  if (projectId && memory.meta?.projectId) {
    const memProjectId = memory.meta.projectId.toLowerCase();
    const queryProjectId = projectId.toLowerCase();

    if (memProjectId === queryProjectId) {
      totalScore += FIELD_WEIGHTS.projectId;
      sources.push({ field: 'projectId', keyword: projectId, weight: FIELD_WEIGHTS.projectId });
    } else if (memProjectId.includes(queryProjectId) || queryProjectId.includes(memProjectId)) {
      totalScore += FIELD_WEIGHTS.projectId * 0.7;
      sources.push({ field: 'projectId', keyword: projectId, weight: FIELD_WEIGHTS.projectId * 0.7 });
    }
  }

  // 2. 关键词匹配
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();

    // projectId 包含关键词
    if (memory.meta?.projectId?.toLowerCase().includes(lowerKeyword)) {
      totalScore += FIELD_WEIGHTS.projectId * 0.8;
      sources.push({ field: 'projectId', keyword, weight: FIELD_WEIGHTS.projectId * 0.8 });
    }

    // tags 匹配
    const tags = memory.meta?.tags || [];
    if (tags.some(t => t.toLowerCase().includes(lowerKeyword))) {
      totalScore += FIELD_WEIGHTS.tags;
      sources.push({ field: 'tags', keyword, weight: FIELD_WEIGHTS.tags });
    }

    // keywords 匹配
    const memKeywords = memory.searchable?.keywords || [];
    if (memKeywords.some(k => k.toLowerCase().includes(lowerKeyword))) {
      totalScore += FIELD_WEIGHTS.keywords;
      sources.push({ field: 'keywords', keyword, weight: FIELD_WEIGHTS.keywords });
    }

    // summary 匹配
    if (memory.content?.summary?.toLowerCase().includes(lowerKeyword)) {
      totalScore += FIELD_WEIGHTS.summary;
      sources.push({ field: 'summary', keyword, weight: FIELD_WEIGHTS.summary });
    }

    // fullText 匹配
    if (memory.searchable?.fullText?.toLowerCase().includes(lowerKeyword)) {
      totalScore += FIELD_WEIGHTS.fullText;
      sources.push({ field: 'fullText', keyword, weight: FIELD_WEIGHTS.fullText });
    }
  }

  // 归一化分数到 0-1
  const maxPossibleScore =
    FIELD_WEIGHTS.projectId +
    keywords.length * (FIELD_WEIGHTS.tags + FIELD_WEIGHTS.keywords + FIELD_WEIGHTS.summary + FIELD_WEIGHTS.fullText);

  const normalizedScore = maxPossibleScore > 0 ? Math.min(1, totalScore / maxPossibleScore) : 0;

  return { score: normalizedScore, sources };
}

/**
 * 查询降级策略
 */
export interface DegradeStrategy {
  /** 策略名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 修改后的查询条件 */
  modifyRequest: (request: QueryRequest) => QueryRequest;
}

/**
 * 降级策略列表（按优先级排序）
 */
export const DEGRADE_STRATEGIES: DegradeStrategy[] = [
  {
    name: 'remove_type_filter',
    description: '移除类型过滤',
    modifyRequest: (req) => ({ ...req, type: undefined }),
  },
  {
    name: 'remove_tags_filter',
    description: '移除标签过滤',
    modifyRequest: (req) => ({ ...req, tags: undefined }),
  },
  {
    name: 'expand_to_project_group',
    description: '扩展到项目组',
    modifyRequest: (req) => ({ ...req, expandProjectGroup: true }),
  },
  {
    name: 'remove_query_keywords',
    description: '移除关键词，只按项目返回最近记忆',
    modifyRequest: (req) => ({ ...req, query: '' }),
  },
  {
    name: 'global_search',
    description: '全局搜索',
    modifyRequest: (req) => ({ ...req, projectId: undefined, expandProjectGroup: false }),
  },
];

/**
 * 查询上下文（用于存储查询过程中的中间状态）
 */
export interface QueryContext {
  /** 原始请求 */
  originalRequest: QueryRequest;
  /** 当前请求（可能经过降级修改） */
  currentRequest: QueryRequest;
  /** 提取的关键词 */
  keywords: string[];
  /** 查询意图 */
  intent: QueryIntent;
  /** 搜索的项目列表 */
  projectIds: string[];
  /** 是否已降级 */
  degraded: boolean;
  /** 降级原因 */
  degradeReason?: string;
  /** 当前降级策略索引 */
  degradeIndex: number;
}

/**
 * 创建查询上下文
 */
export function createQueryContext(request: QueryRequest): QueryContext {
  const keywords = extractQueryKeywords(request.query);
  const intent = analyzeQueryIntent(request);

  return {
    originalRequest: request,
    currentRequest: { ...request },
    keywords,
    intent,
    projectIds: request.projectId ? [request.projectId] : [],
    degraded: false,
    degradeIndex: -1,
  };
}

/**
 * 应用下一个降级策略
 * @returns 是否还有可用的降级策略
 */
export function applyNextDegradeStrategy(context: QueryContext): boolean {
  context.degradeIndex++;

  if (context.degradeIndex >= DEGRADE_STRATEGIES.length) {
    return false;
  }

  const strategy = DEGRADE_STRATEGIES[context.degradeIndex];
  context.currentRequest = strategy.modifyRequest(context.currentRequest);
  context.degraded = true;
  context.degradeReason = strategy.description;

  // 重新提取关键词
  context.keywords = extractQueryKeywords(context.currentRequest.query);

  return true;
}

// 导出类型
export type { Memory };
