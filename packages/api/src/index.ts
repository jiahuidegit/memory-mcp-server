import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import { memoryRoutes } from './routes/memory.js';
import { decisionRoutes } from './routes/decision.js';
import { solutionRoutes } from './routes/solution.js';
import { sessionRoutes } from './routes/session.js';
import { timelineRoutes } from './routes/timeline.js';
import { relationsRoutes } from './routes/relations.js';
import { searchRoutes } from './routes/search.js';
import { statsRoutes } from './routes/stats.js';
import { errorHandler } from './middleware/error.js';

const app = new Hono();

// 中间件
app.use('*', cors());
app.use('*', logger());
app.use('*', prettyJSON());

// 健康检查
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Context Memory System API',
  });
});

// API路由
app.route('/api/memories', memoryRoutes);
app.route('/api/decisions', decisionRoutes);
app.route('/api/solutions', solutionRoutes);
app.route('/api/sessions', sessionRoutes);
app.route('/api/timeline', timelineRoutes);
app.route('/api/relations', relationsRoutes);
app.route('/api/search', searchRoutes);
app.route('/api/stats', statsRoutes);

// 获取所有项目列表（兼容旧接口）
app.get('/api/projects', async (c) => {
  const { getStorage } = await import('./utils/storage.js');
  const storage = getStorage();

  if (!storage.getStats) {
    return c.json([], 200);
  }

  const stats = await storage.getStats();
  const projects = Object.keys(stats.byProject);
  return c.json(projects);
});

// 404处理
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

// 错误处理
app.onError(errorHandler);

// 启动服务器
const port = parseInt(process.env.PORT || '3000', 10);

console.log(`🚀 API Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
