import { Hono } from 'hono';
import { MemoryType } from '@emp/core';
import { getStorage } from '../utils/storage.js';

const app = new Hono();

/**
 * GET /api/timeline?projectId=xxx&type=xxx&limit=50
 * 获取项目时间线
 */
app.get('/', async (c) => {
  const projectId = c.req.query('projectId');
  const type = c.req.query('type');
  const limit = parseInt(c.req.query('limit') || '50', 10);

  if (!projectId) {
    return c.json({ error: '缺少必需参数: projectId' }, 400);
  }

  const storage = getStorage();

  const result = await storage.getTimeline({
    projectId,
    type: type as MemoryType | undefined,
    limit,
  });

  return c.json({
    success: true,
    data: result.entries,
    count: result.entries.length,
    total: result.total,
  });
});

export const timelineRoutes = app;
