/**
 * Embedding 服务包
 *
 * 提供多种 Embedding 实现：
 * - OpenAI: 生产环境推荐
 * - Mock: 测试和开发
 */

// 导出类型
export type {
  IEmbeddingService,
  EmbeddingResult,
  BatchEmbeddingResult,
  Vector,
  EmbeddingProviderConfig,
} from '@emp/core';

// 导出工具函数
export {
  cosineSimilarity,
  euclideanDistance,
  distanceToSimilarity,
  normalizeVector,
  serializeVector,
  deserializeVector,
} from '@emp/core';

// OpenAI 实现
export { OpenAIEmbeddingService, createOpenAIEmbedding } from './openai.js';
export type { OpenAIEmbeddingConfig } from './openai.js';

// Mock 实现
export { MockEmbeddingService, createMockEmbedding } from './mock.js';
export type { MockEmbeddingConfig } from './mock.js';

// Ollama 本地实现（免费）
export { OllamaEmbeddingService, createOllamaEmbedding } from './ollama.js';
export type { OllamaEmbeddingConfig } from './ollama.js';

// ============ 工厂函数 ============

import type { IEmbeddingService, EmbeddingProviderConfig } from '@emp/core';
import { createOpenAIEmbedding } from './openai.js';
import { createMockEmbedding } from './mock.js';
import { createOllamaEmbedding } from './ollama.js';

/**
 * 创建 Embedding 服务
 *
 * @example
 * ```typescript
 * // OpenAI（付费）
 * const embedding = createEmbeddingService({
 *   provider: 'openai',
 *   apiKey: process.env.OPENAI_API_KEY!,
 * });
 *
 * // Ollama（免费本地）
 * const ollamaEmbedding = createEmbeddingService({
 *   provider: 'ollama',
 *   baseUrl: 'http://localhost:11434',
 * });
 *
 * // Mock（测试用）
 * const mockEmbedding = createEmbeddingService({
 *   provider: 'mock',
 * });
 * ```
 */
export function createEmbeddingService(config: EmbeddingProviderConfig): IEmbeddingService {
  switch (config.provider) {
    case 'openai':
      if (!config.apiKey) {
        throw new Error('OpenAI Embedding 需要 apiKey');
      }
      return createOpenAIEmbedding({
        apiKey: config.apiKey,
        model: config.model,
        dimensions: config.dimensions,
        baseUrl: config.baseUrl,
      });

    case 'ollama':
      return createOllamaEmbedding({
        baseUrl: config.baseUrl,
        model: config.model,
      });

    case 'mock':
      return createMockEmbedding({
        dimensions: config.dimensions,
      });

    case 'local':
      // local 作为 ollama 的别名
      return createOllamaEmbedding({
        baseUrl: config.baseUrl,
        model: config.model,
      });

    default:
      throw new Error(`未知的 Embedding 提供者: ${config.provider}`);
  }
}

// ============ 环境变量配置 ============

/**
 * 从环境变量创建 Embedding 服务
 *
 * 环境变量：
 * - EMBEDDING_PROVIDER: openai | ollama | mock（默认 mock）
 * - OPENAI_API_KEY: OpenAI API Key（openai 需要）
 * - EMBEDDING_MODEL: 模型名称
 * - EMBEDDING_DIMENSIONS: 向量维度
 * - EMBEDDING_BASE_URL: API 基础 URL（ollama 默认 http://localhost:11434）
 */
export function createEmbeddingServiceFromEnv(): IEmbeddingService {
  const provider = (process.env.EMBEDDING_PROVIDER || 'mock') as 'openai' | 'ollama' | 'mock' | 'local';
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.EMBEDDING_MODEL;
  const dimensions = process.env.EMBEDDING_DIMENSIONS
    ? parseInt(process.env.EMBEDDING_DIMENSIONS, 10)
    : undefined;
  const baseUrl = process.env.EMBEDDING_BASE_URL;

  return createEmbeddingService({
    provider,
    apiKey,
    model,
    dimensions,
    baseUrl,
  });
}
