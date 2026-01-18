/**
 * OpenAI Embedding 服务
 *
 * 使用 OpenAI text-embedding-3-small 模型
 * 成本：$0.02 / 1M tokens
 */

import {
  type IEmbeddingService,
  type EmbeddingResult,
  type BatchEmbeddingResult,
  type Vector,
  cosineSimilarity,
  OPENAI_DEFAULTS,
} from '@emp/core';

export interface OpenAIEmbeddingConfig {
  /** API Key */
  apiKey: string;
  /** 模型名称（默认 text-embedding-3-small） */
  model?: string;
  /** 向量维度（默认 1536，可选 256、512、1024、1536、3072） */
  dimensions?: number;
  /** API 基础 URL（用于代理或兼容 API） */
  baseUrl?: string;
  /** 请求超时（ms） */
  timeout?: number;
}

export class OpenAIEmbeddingService implements IEmbeddingService {
  readonly provider = 'openai';
  readonly model: string;
  readonly dimensions: number;

  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: OpenAIEmbeddingConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || OPENAI_DEFAULTS.model;
    this.dimensions = config.dimensions || OPENAI_DEFAULTS.dimensions;
    this.baseUrl = config.baseUrl || OPENAI_DEFAULTS.baseUrl;
    this.timeout = config.timeout || 30000;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const response = await this.request([text]);

    return {
      vector: response.data[0].embedding,
      model: response.model,
      dimensions: this.dimensions,
      tokenUsage: response.usage?.total_tokens,
    };
  }

  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    // OpenAI 限制每次最多 2048 个输入
    const batchSize = 2048;
    const allVectors: Vector[] = [];
    let totalTokens = 0;
    let modelName = this.model;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.request(batch);

      // 按 index 排序确保顺序正确
      const sortedData = response.data.sort((a: any, b: any) => a.index - b.index);
      allVectors.push(...sortedData.map((d: any) => d.embedding));

      totalTokens += response.usage?.total_tokens || 0;
      modelName = response.model;
    }

    return {
      vectors: allVectors,
      model: modelName,
      dimensions: this.dimensions,
      totalTokenUsage: totalTokens,
    };
  }

  similarity(a: Vector, b: Vector): number {
    return cosineSimilarity(a, b);
  }

  private async request(input: string[]): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input,
          dimensions: this.dimensions,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(
          `OpenAI API 错误: ${response.status} ${response.statusText} - ${error.error?.message || '未知错误'}`
        );
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * 创建 OpenAI Embedding 服务
 *
 * @example
 * ```typescript
 * const embedding = createOpenAIEmbedding({
 *   apiKey: process.env.OPENAI_API_KEY!,
 * });
 *
 * const result = await embedding.embed('Hello, world!');
 * console.log(result.vector.length); // 1536
 * ```
 */
export function createOpenAIEmbedding(config: OpenAIEmbeddingConfig): OpenAIEmbeddingService {
  return new OpenAIEmbeddingService(config);
}
