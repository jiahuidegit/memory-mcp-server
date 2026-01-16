import { MemoryType, RelationType } from './types.js';

/**
 * 决策选项
 */
export interface DecisionOption {
  /** 选项名称 */
  name: string;
  /** 优点 */
  pros: string[];
  /** 缺点 */
  cons: string[];
}

/**
 * 记忆元信息
 */
export interface MemoryMeta {
  /** 记忆唯一标识 */
  id: string;
  /** 项目ID */
  projectId: string;
  /** 会话ID */
  sessionId: string;
  /** 时间戳（ISO 8601） */
  timestamp: string;
  /** 记忆类型 */
  type: MemoryType;
  /** 标签 */
  tags: string[];
  /** 版本号 */
  version: number;
}

/**
 * 决策上下文（仅 type=decision 时必填）
 */
export interface DecisionContext {
  /** 决策问题 */
  question: string;
  /** 分析过程 */
  analysis?: string;
  /** 决策选项 */
  options: DecisionOption[];
  /** 选择的选项 */
  chosen: string;
  /** 选择理由 */
  reason: string;
}

/**
 * 解决方案上下文（仅 type=solution 时必填）
 */
export interface SolutionContext {
  /** 问题描述 */
  problem: string;
  /** 根本原因 */
  rootCause: string;
  /** 解决方案 */
  solution: string;
  /** 预防措施 */
  prevention?: string;
  /** 关联问题 */
  relatedIssues?: string[];
}

/**
 * 会话上下文（仅 type=session 时必填）
 */
export interface SessionContext {
  /** 会话总结 */
  summary: string;
  /** 本次做出的决策 */
  decisions?: string[];
  /** 未完成任务 */
  unfinishedTasks?: string[];
  /** 下一步计划 */
  nextSteps?: string[];
}

/**
 * 记忆内容
 */
export interface MemoryContent {
  /** 摘要（必填） */
  summary: string;
  /** 结构化数据（必填） */
  data: Record<string, unknown>;
  /** 原始文件/代码片段（可选） */
  artifacts?: Record<string, string>;
}

/**
 * 记忆关系
 */
export interface MemoryRelations {
  /** 替代了哪些记忆 */
  replaces?: string[];
  /** 关联记忆 */
  relatedTo?: string[];
  /** 影响的文件路径 */
  impacts?: string[];
  /** 基于哪条记忆演进 */
  derivedFrom?: string;
}

/**
 * 记忆检索字段
 */
export interface MemorySearchable {
  /** 关键词（用于精确匹配） */
  keywords: string[];
  /** 全文搜索字段（自动生成） */
  fullText: string;
}

/**
 * 基础记忆类型
 */
export interface Memory {
  /** 元信息 */
  meta: MemoryMeta;
  /** 内容 */
  content: MemoryContent;
  /** 关系 */
  relations: MemoryRelations;
  /** 检索字段 */
  searchable: MemorySearchable;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 决策记忆（type=decision）
 */
export interface DecisionMemory extends Memory {
  meta: MemoryMeta & { type: MemoryType.DECISION };
  /** 决策上下文 */
  context: DecisionContext;
}

/**
 * 解决方案记忆（type=solution）
 */
export interface SolutionMemory extends Memory {
  meta: MemoryMeta & { type: MemoryType.SOLUTION };
  /** 解决方案上下文 */
  context: SolutionContext;
}

/**
 * 会话记忆（type=session）
 */
export interface SessionMemory extends Memory {
  meta: MemoryMeta & { type: MemoryType.SESSION };
  /** 会话上下文 */
  context: SessionContext;
}

/**
 * 通用记忆（type=config|code|error）
 */
export type GenericMemory = Memory;

/**
 * 所有记忆类型的联合类型
 */
export type AnyMemory = DecisionMemory | SolutionMemory | SessionMemory | GenericMemory;
