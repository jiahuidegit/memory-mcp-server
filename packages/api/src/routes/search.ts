import { Hono } from 'hono';
import { MemoryType, SearchStrategy } from '@emp/core';
import { getStorage } from '../utils/storage.js';

const app = new Hono();

/**
 * POST /api/search
 * 高级搜索
 *
 * AI 本身就是最好的语义理解器，所以只用全文搜索即可
 * AI 会选择合适的关键词，并自己判断结果相关性
 */
app.post('/', async (c) => {
  const body = await c.req.json();

  const {
    query,
    projectId,
    type,
    tags,
    strategy = 'fulltext', // 默认全文搜索
    limit = 20,
    offset = 0,
  } = body;

  if (!query) {
    return c.json({ error: '缺少必需参数: query' }, 400);
  }

  const storage = getStorage();

  // 字符串转 SearchStrategy enum
  const strategyMap: Record<string, SearchStrategy> = {
    exact: SearchStrategy.EXACT,
    fulltext: SearchStrategy.FULLTEXT,
    auto: SearchStrategy.AUTO,
  };
  const searchStrategy = strategyMap[strategy] || SearchStrategy.FULLTEXT;

  const results = await storage.recall({
    query,
    projectId,
    type: type as MemoryType | undefined,
    tags,
    strategy: searchStrategy,
    limit,
    offset,
  });

  return c.json({
    memories: results.memories,
    total: results.total,
    strategy: results.strategy,
    took: results.took,
    metrics: results.metrics,
  });
});

/**
 * GET /api/search
 * 简单搜索（GET 方式）
 */
app.get('/', async (c) => {
  const query = c.req.query('query') || c.req.query('q');
  const projectId = c.req.query('projectId');
  const type = c.req.query('type');
  const strategyStr = c.req.query('strategy') || 'fulltext';
  const limit = parseInt(c.req.query('limit') || '20', 10);

  if (!query) {
    return c.json({ error: '缺少必需参数: query' }, 400);
  }

  const storage = getStorage();

  const strategyMap: Record<string, SearchStrategy> = {
    exact: SearchStrategy.EXACT,
    fulltext: SearchStrategy.FULLTEXT,
    auto: SearchStrategy.AUTO,
  };
  const strategy = strategyMap[strategyStr] || SearchStrategy.FULLTEXT;

  const results = await storage.recall({
    query,
    projectId,
    type: type as MemoryType | undefined,
    strategy,
    limit,
  });

  return c.json({
    memories: results.memories,
    total: results.total,
    strategy: results.strategy,
    took: results.took,
  });
});

export const searchRoutes = app;
