/**
 * Embedding 服务接口
 *
 * 用于将文本转换为向量，支持语义搜索
 */

// ============ 类型定义 ============

/** 向量类型（固定长度的数字数组） */
export type Vector = number[];

/** Embedding 结果 */
export interface EmbeddingResult {
  /** 向量 */
  vector: Vector;
  /** 模型名称 */
  model: string;
  /** 向量维度 */
  dimensions: number;
  /** token 使用量（如适用） */
  tokenUsage?: number;
}

/** 批量 Embedding 结果 */
export interface BatchEmbeddingResult {
  /** 向量列表 */
  vectors: Vector[];
  /** 模型名称 */
  model: string;
  /** 向量维度 */
  dimensions: number;
  /** 总 token 使用量 */
  totalTokenUsage?: number;
}

/** Embedding 提供者配置 */
export interface EmbeddingProviderConfig {
  /** 提供者类型 */
  provider: 'openai' | 'ollama' | 'local' | 'mock';
  /** API Key（OpenAI 等云服务需要） */
  apiKey?: string;
  /** 模型名称 */
  model?: string;
  /** API 基础 URL（自定义端点） */
  baseUrl?: string;
  /** 向量维度（某些模型支持自定义） */
  dimensions?: number;
}

// ============ Embedding 服务接口 ============

/** Embedding 服务接口 */
export interface IEmbeddingService {
  /** 获取提供者名称 */
  readonly provider: string;

  /** 获取模型名称 */
  readonly model: string;

  /** 获取向量维度 */
  readonly dimensions: number;

  /**
   * 生成单个文本的 Embedding
   * @param text 输入文本
   * @returns Embedding 结果
   */
  embed(text: string): Promise<EmbeddingResult>;

  /**
   * 批量生成 Embedding
   * @param texts 输入文本列表
   * @returns 批量 Embedding 结果
   */
  embedBatch(texts: string[]): Promise<BatchEmbeddingResult>;

  /**
   * 计算两个向量的相似度
   * @param a 向量 A
   * @param b 向量 B
   * @returns 相似度分数（0-1，1 表示完全相同）
   */
  similarity(a: Vector, b: Vector): number;
}

// ============ 向量工具函数 ============

/**
 * 计算余弦相似度
 * @param a 向量 A
 * @param b 向量 B
 * @returns 相似度（-1 到 1，1 表示完全相同）
 */
export function cosineSimilarity(a: Vector, b: Vector): number {
  if (a.length !== b.length) {
    throw new Error(`向量维度不匹配: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * 计算欧氏距离
 * @param a 向量 A
 * @param b 向量 B
 * @returns 距离（越小越相似）
 */
export function euclideanDistance(a: Vector, b: Vector): number {
  if (a.length !== b.length) {
    throw new Error(`向量维度不匹配: ${a.length} vs ${b.length}`);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * 将欧氏距离转换为相似度分数（0-1）
 * @param distance 欧氏距离
 * @returns 相似度分数
 */
export function distanceToSimilarity(distance: number): number {
  return 1 / (1 + distance);
}

/**
 * 归一化向量（使其长度为 1）
 * @param v 输入向量
 * @returns 归一化后的向量
 */
export function normalizeVector(v: Vector): Vector {
  const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  if (norm === 0) return v;
  return v.map(x => x / norm);
}

/**
 * 向量序列化（用于存储）
 * @param v 向量
 * @returns Base64 编码的字符串
 */
export function serializeVector(v: Vector): string {
  const buffer = new Float32Array(v);
  const bytes = new Uint8Array(buffer.buffer);
  return Buffer.from(bytes).toString('base64');
}

/**
 * 向量反序列化
 * @param s Base64 编码的字符串
 * @returns 向量
 */
export function deserializeVector(s: string): Vector {
  const bytes = Buffer.from(s, 'base64');
  const buffer = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4);
  return Array.from(buffer);
}

// ============ 默认配置 ============

/** OpenAI 默认配置 */
export const OPENAI_DEFAULTS = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  baseUrl: 'https://api.openai.com/v1',
} as const;

/** Ollama 默认配置 */
export const OLLAMA_DEFAULTS = {
  model: 'nomic-embed-text',
  dimensions: 768,
  baseUrl: 'http://localhost:11434',
} as const;

/** 本地模型默认配置 */
export const LOCAL_DEFAULTS = {
  model: 'all-MiniLM-L6-v2',
  dimensions: 384,
} as const;
