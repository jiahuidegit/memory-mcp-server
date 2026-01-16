/**
 * 记忆类型枚举
 */
export enum MemoryType {
  /** 架构决策 */
  DECISION = 'decision',
  /** 问题解决方案 */
  SOLUTION = 'solution',
  /** 配置信息 */
  CONFIG = 'config',
  /** 代码实现 */
  CODE = 'code',
  /** 错误记录 */
  ERROR = 'error',
  /** 会话总结 */
  SESSION = 'session',
}

/**
 * 检索策略枚举
 */
export enum SearchStrategy {
  /** L1: 精确匹配（WHERE + 索引） */
  EXACT = 'exact',
  /** L2: 全文搜索（FTS5/Meilisearch） */
  FULLTEXT = 'fulltext',
  /** L3: 语义检索（Embedding 相似度） */
  SEMANTIC = 'semantic',
  /** 自动选择最优策略 */
  AUTO = 'auto',
}

/**
 * 关系类型
 */
export type RelationType = 'replaces' | 'relatedTo' | 'impacts' | 'derivedFrom';
