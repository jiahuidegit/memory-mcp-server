// 枚举和基础类型
export { MemoryType, SearchStrategy } from './types.js';
export type { RelationType } from './types.js';

// Feature Flag 系统
export {
  OpenSourceFeature,
  CloudFeature,
  LicenseType,
  FeatureManager,
  FeatureNotAvailableError,
  getFeatureManager,
  initFeatureManager,
  isFeatureEnabled,
  requireFeature,
} from './features.js';
export type {
  FeatureKey,
  FeatureConfig,
  LicenseInfo,
} from './features.js';

// License 验证
export {
  parseLicenseKey,
  parseLicenseFile,
  loadLicense,
  generateTestLicenseKey,
} from './license.js';
export type {
  LicenseFile,
  LicenseKeyPayload,
  LicenseLoaderOptions,
} from './license.js';

// Embedding 服务
export {
  cosineSimilarity,
  euclideanDistance,
  distanceToSimilarity,
  normalizeVector,
  serializeVector,
  deserializeVector,
  OPENAI_DEFAULTS,
  LOCAL_DEFAULTS,
} from './embedding.js';
export type {
  Vector,
  EmbeddingResult,
  BatchEmbeddingResult,
  EmbeddingProviderConfig,
  IEmbeddingService,
} from './embedding.js';

// 关键词提取
export {
  extractKeywords,
  jaccardSimilarity,
  getKeywordIntersection,
} from './keywords.js';

// 自动关联
export {
  calculateSimilarity,
  findRelatedMemories,
  generateAutoRelations,
  inferProjectGroup,
  isSameProjectGroup,
  getProjectGroupMembers,
} from './auto-relation.js';
export type {
  SimilarityResult,
  RelationCandidate,
  AutoRelationConfig,
  MemoryRelationData,
  ProjectGroupConfig,
} from './auto-relation.js';

// 记忆类型
export type {
  Memory,
  DecisionMemory,
  SolutionMemory,
  SessionMemory,
  GenericMemory,
  AnyMemory,
  MemoryMeta,
  MemoryContent,
  MemoryRelations,
  MemorySearchable,
  DecisionContext,
  DecisionOption,
  SolutionContext,
  SessionContext,
} from './memory.js';

// 存储接口和相关类型
export type {
  IStorage,
  SearchFilters,
  SearchResult,
  PerformanceMetrics,
  TimelineOptions,
  TimelineResult,
  TimelineEntry,
  RelationsOptions,
  RelationNode,
} from './storage.js';

// 智能查询引擎
export {
  QueryIntent,
  FIELD_WEIGHTS,
  DEGRADE_STRATEGIES,
  analyzeQueryIntent,
  extractQueryKeywords,
  calculateRelevanceScore,
  createQueryContext,
  applyNextDegradeStrategy,
} from './query-engine.js';
export type {
  QueryRequest,
  QueryResult,
  QueryContext,
  SearchMatch,
  MatchSource,
  DegradeStrategy,
} from './query-engine.js';
