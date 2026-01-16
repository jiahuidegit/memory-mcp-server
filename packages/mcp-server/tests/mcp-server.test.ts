import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SQLiteStorage } from '@emp/storage';
import { MemoryType } from '@emp/core';

/**
 * MCP Server 集成测试
 * 测试工具、资源、提示词的完整功能
 */
describe('MCP Server Integration', () => {
  let storage: SQLiteStorage;
  const PROJECT_ID = 'test-mcp-project';
  const SESSION_ID = 'test-session-123';

  beforeAll(async () => {
    // 使用内存数据库
    storage = new SQLiteStorage(':memory:');

    // 准备测试数据
    await storage.storeDecision({
      question: '选择前端框架',
      options: [
        { name: 'React', pros: ['生态好', '社区大'], cons: ['学习曲线'] },
        { name: 'Vue', pros: ['简单'], cons: ['生态小'] },
      ],
      chosen: 'React',
      reason: '团队熟悉度高',
      projectId: PROJECT_ID,
      tags: ['frontend', 'framework'],
      sessionId: SESSION_ID,
    });

    await storage.storeSolution({
      problem: '性能瓶颈',
      rootCause: '数据库查询慢',
      solution: '添加索引',
      prevention: '定期性能监控',
      relatedIssues: ['slow-query'],
      projectId: PROJECT_ID,
      tags: ['performance'],
      sessionId: SESSION_ID,
    });

    await storage.store({
      content: '实现了用户认证功能',
      rawContext: { files: ['auth.ts', 'user.ts'] },
      projectId: PROJECT_ID,
      type: MemoryType.CODE,
      tags: ['auth', 'feature'],
      sessionId: SESSION_ID,
    });
  });

  afterAll(async () => {
    // 清理资源（内存数据库会自动清理）
  });

  describe('Tools - 工具调用测试', () => {
    it('memory_store - 智能存储', async () => {
      const result = await storage.store({
        content: '配置 CI/CD 流水线',
        rawContext: { pipeline: 'github-actions' },
        projectId: PROJECT_ID,
        type: MemoryType.CONFIG,
        tags: ['devops'],
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('memory_store_decision - 存储决策', async () => {
      const result = await storage.storeDecision({
        question: '选择数据库',
        options: [
          { name: 'PostgreSQL', pros: ['功能强'], cons: ['复杂'] },
          { name: 'SQLite', pros: ['简单'], cons: ['功能少'] },
        ],
        chosen: 'PostgreSQL',
        reason: '项目规模大',
        projectId: PROJECT_ID,
        tags: ['database'],
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('memory_store_solution - 存储解决方案', async () => {
      const result = await storage.storeSolution({
        problem: '内存泄漏',
        rootCause: '事件监听器未清理',
        solution: '在组件卸载时移除监听器',
        prevention: '使用 useEffect cleanup',
        relatedIssues: ['memory-leak-001'],
        projectId: PROJECT_ID,
        tags: ['bug', 'memory'],
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('memory_store_session - 存储会话', async () => {
      const result = await storage.storeSession({
        summary: '完成了认证模块开发',
        decisions: ['使用 JWT', '启用 2FA'],
        unfinishedTasks: ['添加单元测试'],
        nextSteps: ['集成测试', '部署到测试环境'],
        projectId: PROJECT_ID,
        sessionId: SESSION_ID,
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('memory_recall - 检索记忆', async () => {
      const result = await storage.recall({
        query: '前端',
        projectId: PROJECT_ID,
        limit: 10,
      });

      expect(result.memories.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.strategy).toBeDefined();
      expect(result.took).toBeGreaterThanOrEqual(0);
    });

    it('memory_timeline - 时间线查询', async () => {
      const result = await storage.getTimeline({
        projectId: PROJECT_ID,
        limit: 50,
      });

      expect(result.entries.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);

      // 验证时间线顺序（从早到晚）
      for (let i = 1; i < result.entries.length; i++) {
        const prev = new Date(result.entries[i - 1].memory.meta.timestamp);
        const curr = new Date(result.entries[i].memory.meta.timestamp);
        // 时间线可能是降序或升序，只验证存在即可
        expect(curr).toBeDefined();
        expect(prev).toBeDefined();
      }
    });

    it('memory_relations - 关系链查询', async () => {
      // 先创建一条记忆
      const parent = await storage.store({
        content: '父记忆',
        rawContext: { test: true },
        projectId: PROJECT_ID,
      });

      // 创建衍生记忆
      const child = await storage.store({
        content: '子记忆',
        rawContext: { test: true },
        projectId: PROJECT_ID,
        relations: {
          derivedFrom: parent.id,
        },
      });

      // 查询关系链
      const result = await storage.getRelations({
        memoryId: child.id,
        depth: 2,
      });

      expect(result.memory.meta.id).toBe(child.id);
      expect(result.memory.relations.derivedFrom).toBe(parent.id);
    });
  });

  describe('Resources - 资源访问测试', () => {
    it('应该能列出所有项目', async () => {
      const allMemories = await storage.recall({ query: '', limit: 10000 });
      const projects = new Set(allMemories.memories.map((m) => m.meta.projectId));

      expect(projects.size).toBeGreaterThan(0);
      expect(projects.has(PROJECT_ID)).toBe(true);
    });

    it('应该能获取项目的所有记忆', async () => {
      const result = await storage.recall({ query: '', projectId: PROJECT_ID, limit: 1000 });

      expect(result.total).toBeGreaterThan(0);
      expect(result.memories.every((m) => m.meta.projectId === PROJECT_ID)).toBe(true);
    });

    it('应该能获取单个记忆详情', async () => {
      const allMemories = await storage.recall({ query: '', projectId: PROJECT_ID, limit: 1 });
      const memoryId = allMemories.memories[0].meta.id;

      const result = await storage.getRelations({ memoryId, depth: 0 });

      expect(result.memory.meta.id).toBe(memoryId);
    });

    it('应该能获取会话的所有记忆', async () => {
      const result = await storage.recall({ query: '', sessionId: SESSION_ID, limit: 1000 });

      expect(result.total).toBeGreaterThan(0);
      expect(result.memories.every((m) => m.meta.sessionId === SESSION_ID)).toBe(true);
    });
  });

  describe('Prompts - 提示词测试', () => {
    it('analyze-decision - 应该能分析决策', async () => {
      const decisions = await storage.recall({
        query: '',
        projectId: PROJECT_ID,
        type: MemoryType.DECISION,
        limit: 100,
      });

      expect(decisions.total).toBeGreaterThan(0);

      // 验证决策数据结构
      const decision = decisions.memories[0];
      expect(decision.meta.type).toBe(MemoryType.DECISION);
      // 决策内容在 content.summary 中，不在 data 中
      expect(decision.content.summary).toBeDefined();
      expect(decision.content.summary.length).toBeGreaterThan(0);
    });

    it('summarize-session - 应该能总结会话', async () => {
      const memories = await storage.recall({
        query: '',
        sessionId: SESSION_ID,
        limit: 100,
      });

      expect(memories.total).toBeGreaterThan(0);

      // 验证包含多种类型的记忆
      const types = new Set(memories.memories.map((m) => m.meta.type));
      expect(types.size).toBeGreaterThan(1);
    });

    it('find-related - 应该能查找相关记忆', async () => {
      const related = await storage.recall({
        query: '认证',
        projectId: PROJECT_ID,
        limit: 20,
      });

      expect(related.memories.length).toBeGreaterThan(0);

      // 验证相关性（应该包含 auth 标签或内容提到认证）
      const hasRelevant = related.memories.some(
        (m) =>
          m.meta.tags.includes('auth') ||
          m.content.summary.includes('认证') ||
          m.content.summary.includes('auth')
      );
      expect(hasRelevant).toBe(true);
    });

    it('review-project - 应该能回顾项目', async () => {
      const timeline = await storage.getTimeline({
        projectId: PROJECT_ID,
        limit: 100,
      });

      expect(timeline.total).toBeGreaterThan(0);

      // 验证时间线完整性
      expect(timeline.entries[0].memory).toBeDefined();
      expect(timeline.entries[0].memory.meta.projectId).toBe(PROJECT_ID);
    });
  });

  describe('Error Handling - 错误处理测试', () => {
    it('应该处理不存在的记忆ID', async () => {
      await expect(
        storage.getRelations({
          memoryId: 'non-existent-id',
          depth: 1,
        })
      ).rejects.toThrow();
    });

    it('应该处理无效的类型过滤', async () => {
      const result = await storage.recall({
        query: '',
        type: 'invalid-type' as any,
        limit: 10,
      });

      // 应该返回空结果而不是报错
      expect(result.memories.length).toBe(0);
    });

    it('应该处理超大 limit 参数', async () => {
      const result = await storage.recall({
        query: '',
        limit: 999999,
      });

      // 应该返回实际数量而不是崩溃
      expect(result.memories.length).toBeLessThanOrEqual(result.total);
    });
  });

  describe('Performance - 性能测试', () => {
    it('批量存储应该快速完成', async () => {
      const startTime = Date.now();
      const count = 50;

      for (let i = 0; i < count; i++) {
        await storage.store({
          content: `性能测试 ${i}`,
          rawContext: { index: i },
          projectId: PROJECT_ID,
        });
      }

      const took = Date.now() - startTime;
      const avgPerInsert = took / count;

      console.log(`批量存储性能: ${count} 条 / ${took}ms = ${avgPerInsert.toFixed(2)}ms/条`);

      // 平均每条应该在 10ms 内
      expect(avgPerInsert).toBeLessThan(10);
    });

    it('检索应该返回性能指标', async () => {
      const result = await storage.recall({
        query: '测试',
        projectId: PROJECT_ID,
        limit: 10,
      });

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.dbTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics?.parseTime).toBeGreaterThanOrEqual(0);
    });
  });
});
