import { describe, it, expect } from 'vitest';
import { MemoryType, SearchStrategy } from '../src/types.js';
import type { Memory, DecisionMemory } from '../src/memory.js';

describe('Core Types', () => {
  describe('MemoryType', () => {
    it('应该包含所有记忆类型', () => {
      expect(MemoryType.DECISION).toBe('decision');
      expect(MemoryType.SOLUTION).toBe('solution');
      expect(MemoryType.CONFIG).toBe('config');
      expect(MemoryType.CODE).toBe('code');
      expect(MemoryType.ERROR).toBe('error');
      expect(MemoryType.SESSION).toBe('session');
    });
  });

  describe('SearchStrategy', () => {
    it('应该包含所有检索策略', () => {
      expect(SearchStrategy.EXACT).toBe('exact');
      expect(SearchStrategy.FULLTEXT).toBe('fulltext');
      expect(SearchStrategy.SEMANTIC).toBe('semantic');
      expect(SearchStrategy.AUTO).toBe('auto');
    });
  });

  describe('Memory 类型', () => {
    it('应该有正确的类型结构', () => {
      const memory: Memory = {
        meta: {
          id: 'mem_123',
          projectId: 'my-app',
          sessionId: 'session_abc',
          timestamp: '2026-01-14T10:00:00Z',
          type: MemoryType.CODE,
          tags: ['auth', 'jwt'],
          version: 1,
        },
        content: {
          summary: '实现了 JWT 认证',
          data: { feature: 'auth' },
        },
        relations: {
          impacts: ['src/auth.ts'],
        },
        searchable: {
          keywords: ['jwt', 'auth'],
          fullText: '实现了 JWT 认证',
        },
        createdAt: '2026-01-14T10:00:00Z',
        updatedAt: '2026-01-14T10:00:00Z',
      };

      expect(memory.meta.type).toBe(MemoryType.CODE);
      expect(memory.content.summary).toBe('实现了 JWT 认证');
    });

    it('DecisionMemory 应该包含 context', () => {
      const decision: DecisionMemory = {
        meta: {
          id: 'mem_456',
          projectId: 'my-app',
          sessionId: 'session_abc',
          timestamp: '2026-01-14T10:00:00Z',
          type: MemoryType.DECISION,
          tags: ['architecture'],
          version: 1,
        },
        context: {
          question: '选择什么状态管理库？',
          options: [
            { name: 'Redux', pros: ['成熟'], cons: ['复杂'] },
            { name: 'Zustand', pros: ['简单'], cons: ['生态小'] },
          ],
          chosen: 'Zustand',
          reason: '项目小型，Zustand 足够用',
        },
        content: {
          summary: '[决策] 选择 Zustand',
          data: {},
        },
        relations: {},
        searchable: {
          keywords: ['zustand', 'redux'],
          fullText: '选择什么状态管理库？',
        },
        createdAt: '2026-01-14T10:00:00Z',
        updatedAt: '2026-01-14T10:00:00Z',
      };

      expect(decision.meta.type).toBe(MemoryType.DECISION);
      expect(decision.context.chosen).toBe('Zustand');
      expect(decision.context.options).toHaveLength(2);
    });
  });
});
