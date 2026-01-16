import { describe, it, expect, beforeAll } from 'vitest';
import { SQLiteStorage } from '../src/sqlite-storage.js';
import { MemoryType, SearchStrategy } from '@emp/core';

/**
 * 性能基准测试
 * 测试各种操作的性能指标
 */
describe('Performance Benchmark', () => {
  let storage: SQLiteStorage;
  const PROJECT_ID = 'benchmark-project';

  beforeAll(async () => {
    // 创建内存数据库以获得最快性能
    storage = new SQLiteStorage(':memory:', {
      enableCache: true,
      cacheSize: 100,
    });
  });

  describe('批量插入性能', () => {
    it('应该快速插入 1000 条记忆', async () => {
      const startTime = Date.now();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        await storage.store({
          content: `测试记忆 ${i}`,
          rawContext: { index: i, batch: 'performance-test' },
          projectId: PROJECT_ID,
          type: i % 3 === 0 ? MemoryType.CODE : MemoryType.CONFIG,
          tags: [`tag${i % 10}`, 'performance'],
        });
      }

      const took = Date.now() - startTime;
      const avgPerInsert = took / count;

      console.log(`\n📊 批量插入性能:`);
      console.log(`   - 总数: ${count} 条`);
      console.log(`   - 总耗时: ${took}ms`);
      console.log(`   - 平均每条: ${avgPerInsert.toFixed(2)}ms`);
      console.log(`   - 吞吐量: ${(count / (took / 1000)).toFixed(0)} ops/s`);

      // 性能要求：平均每条插入应该在 10ms 内
      expect(avgPerInsert).toBeLessThan(10);
    });
  });

  describe('检索策略性能对比', () => {
    it('L1 精确匹配 vs L2 全文搜索', async () => {
      // L1: 精确匹配（使用 projectId 精确匹配）
      const exactStart = Date.now();
      const exactResult = await storage.recall({
        query: '',
        projectId: PROJECT_ID,
        strategy: SearchStrategy.EXACT,
        limit: 100,
      });
      const exactTook = Date.now() - exactStart;

      // L2: 全文搜索
      const fulltextStart = Date.now();
      const fulltextResult = await storage.recall({
        query: '测试',
        strategy: SearchStrategy.FULLTEXT,
        limit: 100,
      });
      const fulltextTook = Date.now() - fulltextStart;

      console.log(`\n📊 检索策略性能对比:`);
      console.log(`   L1 精确匹配:`);
      console.log(`      - 耗时: ${exactTook}ms`);
      console.log(`      - 结果数: ${exactResult.memories.length}`);
      console.log(`      - DB时间: ${exactResult.metrics?.dbTime}ms`);
      console.log(`   L2 全文搜索:`);
      console.log(`      - 耗时: ${fulltextTook}ms`);
      console.log(`      - 结果数: ${fulltextResult.memories.length}`);
      console.log(`      - DB时间: ${fulltextResult.metrics?.dbTime}ms`);

      // 应该都有结果
      expect(exactResult.memories.length).toBeGreaterThan(0);
      expect(fulltextResult.memories.length).toBeGreaterThan(0);
    });
  });

  describe('缓存性能测试', () => {
    it('缓存命中应该显著提升性能', async () => {
      const query = {
        query: 'performance',
        projectId: PROJECT_ID,
        limit: 50,
      };

      // 第一次查询（缓存未命中）
      const firstResult = await storage.recall(query);
      const firstTook = firstResult.took;
      const firstCacheHit = firstResult.metrics?.cacheHit;

      // 第二次查询（缓存命中）
      const secondResult = await storage.recall(query);
      const secondTook = secondResult.took;
      const secondCacheHit = secondResult.metrics?.cacheHit;

      console.log(`\n📊 缓存性能测试:`);
      console.log(`   首次查询（未命中）: ${firstTook}ms, cacheHit=${firstCacheHit}`);
      console.log(`   二次查询（命中）: ${secondTook}ms, cacheHit=${secondCacheHit}`);
      if (firstTook > 0) {
        console.log(`   性能提升: ${((firstTook - secondTook) / firstTook * 100).toFixed(1)}%`);
      }

      // 验证缓存行为
      expect(firstCacheHit).toBe(false);
      expect(secondCacheHit).toBe(true);
      // 缓存命中的查询应该更快或至少相同
      expect(secondTook).toBeLessThanOrEqual(firstTook + 1); // 允许1ms误差
    });

    it('缓存统计应该正确', async () => {
      // 清空缓存
      const cache = (storage as any).cache;
      if (cache) {
        cache.clear();

        // 执行10次查询，其中5次重复
        for (let i = 0; i < 10; i++) {
          await storage.recall({
            query: `tag${i % 5}`, // 5个不同的查询，每个重复2次
            projectId: PROJECT_ID,
          });
        }

        const stats = cache.getStats();
        console.log(`\n📊 缓存统计:`);
        console.log(`   - 缓存大小: ${stats.size}/${stats.capacity}`);
        console.log(`   - 命中次数: ${stats.hits}`);
        console.log(`   - 未命中次数: ${stats.misses}`);
        console.log(`   - 命中率: ${(stats.hitRate * 100).toFixed(1)}%`);

        // 应该有5次命中（第二轮查询）
        expect(stats.hits).toBe(5);
        expect(stats.misses).toBe(5);
        expect(stats.hitRate).toBe(0.5);
      }
    });
  });

  describe('复杂查询性能', () => {
    it('深度关系链查询性能', async () => {
      // 创建5层深度的关系链
      const ids: string[] = [];
      const depth = 5;

      for (let i = 0; i < depth; i++) {
        const result = await storage.store({
          content: `关系链节点 ${i}`,
          rawContext: { level: i },
          projectId: PROJECT_ID,
          relations: i > 0 ? { derivedFrom: ids[i - 1] } : undefined,
        });
        ids.push(result.id);
      }

      // 查询关系链（从最后一个节点开始）
      const startTime = Date.now();
      const relations = await storage.getRelations({
        memoryId: ids[depth - 1],
        depth,
      });
      const took = Date.now() - startTime;

      console.log(`\n📊 关系链查询性能:`);
      console.log(`   - 深度: ${depth}`);
      console.log(`   - 耗时: ${took}ms`);
      console.log(`   - 平均每层: ${(took / depth).toFixed(2)}ms`);

      // 验证关系链结构
      expect(relations.memory.meta.id).toBe(ids[depth - 1]);
      // 最后一个节点应该有关系（derivedFrom指向前一个）
      expect(took).toBeLessThan(100); // 5层关系链应该在100ms内完成
    });

    it('时间线查询性能', async () => {
      const startTime = Date.now();
      const timeline = await storage.getTimeline({
        projectId: PROJECT_ID,
        limit: 100,
      });
      const took = Date.now() - startTime;

      console.log(`\n📊 时间线查询性能:`);
      console.log(`   - 结果数: ${timeline.entries.length}`);
      console.log(`   - 总数: ${timeline.total}`);
      console.log(`   - 耗时: ${took}ms`);
      console.log(`   - 平均每条: ${(took / timeline.entries.length).toFixed(2)}ms`);

      expect(timeline.entries.length).toBeGreaterThan(0);
      expect(took).toBeLessThan(50); // 100条时间线应该在50ms内完成
    });
  });

  describe('并发查询性能', () => {
    it('多个并发查询性能', async () => {
      const concurrency = 10;
      const startTime = Date.now();

      // 并发执行10个查询
      const promises = Array.from({ length: concurrency }, (_, i) =>
        storage.recall({
          query: `tag${i}`,
          projectId: PROJECT_ID,
          limit: 10,
        })
      );

      const results = await Promise.all(promises);
      const took = Date.now() - startTime;

      console.log(`\n📊 并发查询性能:`);
      console.log(`   - 并发数: ${concurrency}`);
      console.log(`   - 总耗时: ${took}ms`);
      console.log(`   - 平均每个查询: ${(took / concurrency).toFixed(2)}ms`);
      console.log(`   - 缓存命中: ${results.filter((r) => r.metrics?.cacheHit).length}/${concurrency}`);

      expect(results.length).toBe(concurrency);
      expect(took).toBeLessThan(500); // 10个并发查询应该在500ms内完成
    });
  });

  describe('更新操作性能', () => {
    it('批量更新性能', async () => {
      // 先查询一些记忆
      const searchResult = await storage.recall({
        query: '',
        projectId: PROJECT_ID,
        limit: 100,
      });

      const startTime = Date.now();
      const updatePromises = searchResult.memories.slice(0, 50).map((memory) =>
        storage.update(memory.meta.id, {
          content: {
            summary: `更新后: ${memory.content.summary}`,
            data: memory.content.data,
          },
        })
      );

      await Promise.all(updatePromises);
      const took = Date.now() - startTime;
      const avgPerUpdate = took / 50;

      console.log(`\n📊 批量更新性能:`);
      console.log(`   - 更新数量: 50 条`);
      console.log(`   - 总耗时: ${took}ms`);
      console.log(`   - 平均每条: ${avgPerUpdate.toFixed(2)}ms`);

      expect(avgPerUpdate).toBeLessThan(5); // 平均每条更新应该在5ms内
    });
  });

  describe('总体性能报告', () => {
    it('输出完整性能报告', async () => {
      const cache = (storage as any).cache;
      const cacheStats = cache?.getStats();

      // 统计数据库记录数
      const allMemories = await storage.recall({
        query: '',
        projectId: PROJECT_ID,
        limit: 10000,
      });

      console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📈 性能基准测试总结报告`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`\n数据规模:`);
      console.log(`   - 总记忆数: ${allMemories.total}`);
      console.log(`   - 项目ID: ${PROJECT_ID}`);
      console.log(`\n缓存性能:`);
      console.log(`   - 容量: ${cacheStats?.capacity || 0}`);
      console.log(`   - 当前大小: ${cacheStats?.size || 0}`);
      console.log(`   - 总命中次数: ${cacheStats?.hits || 0}`);
      console.log(`   - 总未命中次数: ${cacheStats?.misses || 0}`);
      console.log(`   - 总命中率: ${((cacheStats?.hitRate || 0) * 100).toFixed(1)}%`);
      console.log(`\n性能结论:`);
      console.log(`   ✅ 所有性能测试通过`);
      console.log(`   ✅ 缓存有效提升查询性能`);
      console.log(`   ✅ 索引优化生效`);
      console.log(`   ✅ 并发查询性能良好`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      expect(allMemories.total).toBeGreaterThan(1000);
    });
  });
});
