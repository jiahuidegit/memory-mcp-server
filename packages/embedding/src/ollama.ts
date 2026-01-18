/**
 * Ollama Embedding 服务
 *
 * 完全免费的本地 Embedding 方案
 *
 * 安装 Ollama: https://ollama.ai
 * 拉取模型: ollama pull nomic-embed-text
 */

import type { IEmbeddingService, EmbeddingResult, BatchEmbeddingResult, Vector } from '@emp/core';
import { cosineSimilarity } from '@emp/core';

export interface OllamaEmbeddingConfig {
  /** Ollama 服务地址，默认 http://localhost:11434 */
  baseUrl?: string;
  /** 模型名称，默认 nomic-embed-text */
  model?: string;
}

export class OllamaEmbeddingService implements IEmbeddingService {
  readonly provider = 'ollama';
  readonly model: string;
  readonly dimensions = 768; // nomic-embed-text 默认维度

  private baseUrl: string;

  constructor(config: OllamaEmbeddingConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'nomic-embed-text';
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama Embedding 失败: ${error}`);
    }

    const data = (await response.json()) as { embedding: number[] };

    return {
      vector: data.embedding,
      model: this.model,
      dimensions: data.embedding.length,
      tokenUsage: text.length, // Ollama 不返回 token 数，用字符数估算
    };
  }

  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    const vectors: Vector[] = [];
    let totalTokens = 0;

    // Ollama 不支持批量，逐个处理
    for (const text of texts) {
      const result = await this.embed(text);
      vectors.push(result.vector);
      totalTokens += result.tokenUsage || 0;
    }

    return {
      vectors,
      model: this.model,
      dimensions: vectors[0]?.length || this.dimensions,
      totalTokenUsage: totalTokens,
    };
  }

  similarity(a: Vector, b: Vector): number {
    return cosineSimilarity(a, b);
  }
}

/**
 * 创建 Ollama Embedding 服务
 */
export function createOllamaEmbedding(config?: OllamaEmbeddingConfig): IEmbeddingService {
  return new OllamaEmbeddingService(config);
}
