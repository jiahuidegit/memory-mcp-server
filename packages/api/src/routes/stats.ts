import { Hono } from 'hono';
import { getStorage } from '../utils/storage.js';

const app = new Hono();

/**
 * GET /api/stats
 * 获取统计信息
 */
app.get('/', async (c) => {
  const projectId = c.req.query('projectId');
  const storage = getStorage();

  // 检查 storage 是否支持 getStats 方法
  if (!storage.getStats) {
    return c.json({ error: '当前存储后端不支持统计功能' }, 501);
  }

  const stats = await storage.getStats(projectId || undefined);
  return c.json(stats);
});

/**
 * GET /api/stats/projects
 * 获取所有项目列表
 */
app.get('/projects', async (c) => {
  const storage = getStorage();

  if (!storage.getStats) {
    return c.json({ error: '当前存储后端不支持统计功能' }, 501);
  }

  const stats = await storage.getStats();
  const projects = Object.entries(stats.byProject).map(([id, count]) => ({
    id,
    count,
  }));

  // 按数量降序排列
  projects.sort((a, b) => b.count - a.count);

  return c.json({ projects });
});

export const statsRoutes = app;
