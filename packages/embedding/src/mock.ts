/**
 * Mock Embedding 服务
 *
 * 用于测试和开发，生成确定性的伪向量
 * 基于简单的哈希算法，相似文本会产生相似向量
 */

import {
  type IEmbeddingService,
  type EmbeddingResult,
  type BatchEmbeddingResult,
  type Vector,
  cosineSimilarity,
} from '@emp/core';

export interface MockEmbeddingConfig {
  /** 向量维度（默认 384） */
  dimensions?: number;
  /** 模拟延迟（ms，默认 0） */
  delay?: number;
}

export class MockEmbeddingService implements IEmbeddingService {
  readonly provider = 'mock';
  readonly model = 'mock-embedding-v1';
  readonly dimensions: number;

  private delay: number;

  constructor(config: MockEmbeddingConfig = {}) {
    this.dimensions = config.dimensions || 384;
    this.delay = config.delay || 0;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    return {
      vector: this.generateVector(text),
      model: this.model,
      dimensions: this.dimensions,
      tokenUsage: Math.ceil(text.length / 4), // 粗略估计 token 数
    };
  }

  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    return {
      vectors: texts.map(text => this.generateVector(text)),
      model: this.model,
      dimensions: this.dimensions,
      totalTokenUsage: Math.ceil(texts.join('').length / 4),
    };
  }

  similarity(a: Vector, b: Vector): number {
    return cosineSimilarity(a, b);
  }

  /**
   * 生成确定性的伪向量
   * 相似的文本会产生相似的向量
   */
  private generateVector(text: string): Vector {
    const vector: number[] = new Array(this.dimensions).fill(0);

    // 使用简单的字符级特征
    const normalized = text.toLowerCase().trim();

    // 1. 字符频率特征
    for (let i = 0; i < normalized.length; i++) {
      const charCode = normalized.charCodeAt(i);
      const index = charCode % this.dimensions;
      vector[index] += 1;
    }

    // 2. 双字符特征（bigram）
    for (let i = 0; i < normalized.length - 1; i++) {
      const bigram = normalized.charCodeAt(i) * 256 + normalized.charCodeAt(i + 1);
      const index = bigram % this.dimensions;
      vector[index] += 0.5;
    }

    // 3. 长度特征
    vector[0] = normalized.length / 100;

    // 4. 归一化
    const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }
}

/**
 * 创建 Mock Embedding 服务
 *
 * @example
 * ```typescript
 * const embedding = createMockEmbedding();
 *
 * const result = await embedding.embed('Hello, world!');
 * console.log(result.vector.length); // 384
 *
 * // 相似文本会有较高的相似度
 * const v1 = (await embedding.embed('Hello world')).vector;
 * const v2 = (await embedding.embed('Hello there')).vector;
 * console.log(embedding.similarity(v1, v2)); // ~0.8+
 * ```
 */
export function createMockEmbedding(config?: MockEmbeddingConfig): MockEmbeddingService {
  return new MockEmbeddingService(config);
}
