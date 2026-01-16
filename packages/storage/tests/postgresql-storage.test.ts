import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSQLStorage } from '../src/postgresql-storage.js';
import { MemoryType, SearchStrategy } from '@emp/core';

/**
 * PostgreSQL集成测试
 *
 * 需要环境变量：
 * - TEST_DATABASE_URL: PostgreSQL连接字符串
 *
 * 如果未设置，这些测试将被跳过
 */
const DATABASE_URL = process.env.TEST_DATABASE_URL;
const shouldRunTests = !!DATABASE_URL;

describe.skipIf(!shouldRunTests)('PostgreSQLStorage', () => {
  let storage: PostgreSQLStorage;

  beforeAll(async () => {
    if (!DATABASE_URL) return;

    storage = new PostgreSQLStorage(DATABASE_URL);

    // 清理测试数据
    await storage['prisma'].$executeRaw`DELETE FROM memories WHERE "projectId" LIKE 'test-%'`;
  });

  afterAll(async () => {
    if (storage) {
      await storage.close();
    }
  });

  beforeEach(async () => {
    // 每个测试前清理
    await storage['prisma'].$executeRaw`DELETE FROM memories WHERE "projectId" LIKE 'test-%'`;
  });

  describe('store()', () => {
    it('应该成功存储通用记忆', async () => {
      const result = await storage.store({
        content: '实现了JWT认证功能',
        rawContext: { feature: 'auth', files: ['src/auth.ts'] },
        projectId: 'test-project-1',
        type: MemoryType.CODE,
        tags: ['auth', 'jwt'],
        sessionId: 'session_123',
      });

      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^mem_/);
    });

    it('应该支持关系链存储', async () => {
      const result = await storage.store({
        content: '优化了认证逻辑',
        rawContext: {},
        projectId: 'test-project-2',
        relations: {
          replaces: ['mem_old_123'],
          impacts: ['src/auth.ts'],
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('storeDecision()', () => {
    it('应该成功存储决策记忆', async () => {
      const result = await storage.storeDecision({
        question: '选择什么状态管理库？',
        options: [
          { name: 'Redux', pros: ['成熟', '生态好'], cons: ['复杂', '样板代码多'] },
          { name: 'Zustand', pros: ['简单', '轻量'], cons: ['生态小'] },
        ],
        chosen: 'Zustand',
        reason: '项目规模小，Zustand足够用',
        projectId: 'test-project-3',
        tags: ['architecture', 'state-management'],
      });

      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^mem_/);
    });
  });

  describe('storeSolution()', () => {
    it('应该成功存储解决方案记忆', async () => {
      const result = await storage.storeSolution({
        problem: 'React组件重复渲染导致性能问题',
        rootCause: '未使用memo和useMemo优化',
        solution: '使用React.memo包裹组件，useMemo缓存计算结果',
        prevention: '遵循React性能优化最佳实践',
        relatedIssues: ['issue-123', 'issue-456'],
        projectId: 'test-project-4',
        tags: ['performance', 'react'],
        artifacts: {
          'before.tsx': 'const MyComponent = () => { ... }',
          'after.tsx': 'const MyComponent = React.memo(() => { ... })',
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('storeSession()', () => {
    it('应该成功存储会话记忆', async () => {
      const result = await storage.storeSession({
        summary: '完成了用户认证模块的开发',
        decisions: ['选择JWT作为认证方式'],
        unfinishedTasks: ['编写单元测试', '补充文档'],
        nextSteps: ['集成到主分支', '进行Code Review'],
        projectId: 'test-project-5',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('recall()', () => {
    beforeEach(async () => {
      // 插入测试数据
      await storage.store({
        content: '实现了JWT认证',
        rawContext: {},
        projectId: 'test-recall-1',
        type: MemoryType.CODE,
        tags: ['auth'],
      });

      await storage.storeDecision({
        question: '选择数据库',
        options: [
          { name: 'PostgreSQL', pros: ['强大'], cons: ['复杂'] },
          { name: 'SQLite', pros: ['简单'], cons: ['功能少'] },
        ],
        chosen: 'PostgreSQL',
        reason: '云端部署',
        projectId: 'test-recall-1',
      });

      await storage.store({
        content: '配置CI/CD',
        rawContext: {},
        projectId: 'test-recall-other',
        type: MemoryType.CONFIG,
      });
    });

    it('L1: 应该支持精确匹配检索', async () => {
      const result = await storage.recall({
        query: 'JWT',
        strategy: SearchStrategy.EXACT,
      });

      expect(result.memories.length).toBeGreaterThan(0);
      expect(result.strategy).toBe(SearchStrategy.EXACT);
      expect(result.took).toBeGreaterThanOrEqual(0);
    });

    it('L2: 应该支持全文搜索', async () => {
      const result = await storage.recall({
        query: '认证',
        strategy: SearchStrategy.FULLTEXT,
      });

      expect(result.memories.length).toBeGreaterThan(0);
      expect(result.strategy).toBe(SearchStrategy.FULLTEXT);
    });

    it('应该支持按项目过滤', async () => {
      const result = await storage.recall({
        query: '',
        projectId: 'test-recall-1',
      });

      expect(result.memories.length).toBe(2);
      expect(result.memories.every((m) => m.meta.projectId === 'test-recall-1')).toBe(true);
    });

    it('应该支持按类型过滤', async () => {
      const result = await storage.recall({
        query: '',
        projectId: 'test-recall-1',
        type: MemoryType.CODE,
      });

      expect(result.memories.length).toBe(1);
      expect(result.memories[0].meta.type).toBe(MemoryType.CODE);
    });

    it('AUTO策略：找不到结果时应该降级到全文搜索', async () => {
      const result = await storage.recall({
        query: 'nonexistent_exact_match_12345',
        strategy: SearchStrategy.AUTO,
      });

      // AUTO策略会先尝试EXACT，找不到则降级到FULLTEXT
      expect(result.strategy).toBe(SearchStrategy.FULLTEXT);
    });

    it('应该支持分页', async () => {
      const result = await storage.recall({
        query: '',
        projectId: 'test-recall-1',
        limit: 1,
        offset: 0,
      });

      expect(result.memories.length).toBe(1);
    });
  });

  describe('getTimeline()', () => {
    beforeEach(async () => {
      // 插入带时间戳的测试数据
      await storage.store({
        content: '第一条记忆',
        rawContext: {},
        projectId: 'test-timeline',
      });

      // 等待10ms确保时间戳不同
      await new Promise((resolve) => setTimeout(resolve, 10));

      await storage.store({
        content: '第二条记忆',
        rawContext: {},
        projectId: 'test-timeline',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await storage.store({
        content: '第三条记忆',
        rawContext: {},
        projectId: 'test-timeline',
      });
    });

    it('应该按时间倒序返回时间线', async () => {
      const result = await storage.getTimeline({
        projectId: 'test-timeline',
      });

      expect(result.entries.length).toBe(3);
      expect(result.total).toBe(3);

      // 第一条是最新的
      expect(result.entries[0].memory.content.summary).toBe('第三条记忆');
      expect(result.entries[2].memory.content.summary).toBe('第一条记忆');
    });

    it('应该包含prev/next指针', async () => {
      const result = await storage.getTimeline({
        projectId: 'test-timeline',
      });

      const firstEntry = result.entries[0];
      const lastEntry = result.entries[2];

      expect(firstEntry.prevMemoryId).toBeUndefined();
      expect(firstEntry.nextMemoryId).toBeDefined();
      expect(lastEntry.nextMemoryId).toBeUndefined();
      expect(lastEntry.prevMemoryId).toBeDefined();
    });

    it('应该支持分页', async () => {
      const result = await storage.getTimeline({
        projectId: 'test-timeline',
        limit: 2,
        offset: 1,
      });

      expect(result.entries.length).toBe(2);
    });
  });

  describe('getRelations()', () => {
    it('应该返回关系链', async () => {
      const { id: id1 } = await storage.store({
        content: '原始实现',
        rawContext: {},
        projectId: 'test-relations',
      });

      const { id: id2 } = await storage.store({
        content: '优化版本',
        rawContext: {},
        projectId: 'test-relations',
        relations: {
          replaces: [id1],
        },
      });

      const result = await storage.getRelations({
        memoryId: id2,
        depth: 1,
      });

      expect(result.memory.meta.id).toBe(id2);
      expect(result.related).toBeDefined();
      expect(result.related?.length).toBe(1);
      expect(result.related?.[0].memory.meta.id).toBe(id1);
    });

    it('应该支持多层深度查询', async () => {
      const { id: id1 } = await storage.store({
        content: 'v1',
        rawContext: {},
        projectId: 'test-deep-relations',
      });

      const { id: id2 } = await storage.store({
        content: 'v2',
        rawContext: {},
        projectId: 'test-deep-relations',
        relations: { derivedFrom: id1 },
      });

      const { id: id3 } = await storage.store({
        content: 'v3',
        rawContext: {},
        projectId: 'test-deep-relations',
        relations: { derivedFrom: id2 },
      });

      const result = await storage.getRelations({
        memoryId: id3,
        depth: 2,
      });

      expect(result.memory.meta.id).toBe(id3);
      expect(result.related?.length).toBe(1);
      expect(result.related?.[0].memory.meta.id).toBe(id2);
      expect(result.related?.[0].related?.length).toBe(1);
      expect(result.related?.[0].related?.[0].memory.meta.id).toBe(id1);
    });
  });

  describe('delete()', () => {
    it('应该成功删除记忆', async () => {
      const { id } = await storage.store({
        content: '测试删除',
        rawContext: {},
        projectId: 'test-delete',
      });

      const deleteResult = await storage.delete(id);
      expect(deleteResult.success).toBe(true);

      // 验证已删除
      const searchResult = await storage.recall({
        query: '',
        projectId: 'test-delete',
      });
      expect(searchResult.memories.length).toBe(0);
    });

    it('删除不存在的记忆应该返回失败', async () => {
      const result = await storage.delete('nonexistent_id');
      expect(result.success).toBe(false);
    });
  });

  describe('update()', () => {
    it('应该成功更新记忆内容', async () => {
      const { id } = await storage.store({
        content: '原始内容',
        rawContext: { version: 1 },
        projectId: 'test-update',
        tags: ['tag1'],
      });

      const updateResult = await storage.update(id, {
        content: {
          summary: '更新后的内容',
          data: { version: 2 },
        },
        meta: {
          tags: ['tag1', 'tag2'],
        } as any,
      });

      expect(updateResult.success).toBe(true);

      // 验证更新
      const searchResult = await storage.recall({
        query: '',
        projectId: 'test-update',
      });
      const updated = searchResult.memories[0];
      expect(updated.content.summary).toBe('更新后的内容');
      expect(updated.content.data).toEqual({ version: 2 });
      expect(updated.meta.tags).toEqual(['tag1', 'tag2']);
    });

    it('应该成功更新关系', async () => {
      const { id: id1 } = await storage.store({
        content: 'v1',
        rawContext: {},
        projectId: 'test-update-relations',
      });

      const { id: id2 } = await storage.store({
        content: 'v2',
        rawContext: {},
        projectId: 'test-update-relations',
      });

      const updateResult = await storage.update(id2, {
        relations: {
          replaces: [id1],
        },
      });

      expect(updateResult.success).toBe(true);
    });

    it('更新不存在的记忆应该返回失败', async () => {
      const result = await storage.update('nonexistent_id', {
        content: { summary: 'test', data: {} },
      });
      expect(result.success).toBe(false);
    });
  });
});

// 环境提示
if (!shouldRunTests) {
  console.log(`
    ⚠️  PostgreSQL集成测试被跳过

    要运行这些测试，请设置环境变量：
    TEST_DATABASE_URL="postgresql://user:password@localhost:5432/cms_test"

    然后运行：pnpm test
  `);
}
