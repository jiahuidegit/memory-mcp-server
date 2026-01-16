import { Hono } from 'hono';
import { getStorage } from '../utils/storage.js';

const app = new Hono();

/**
 * POST /api/sessions
 * 存储会话
 */
app.post('/', async (c) => {
  const body = await c.req.json();

  const { summary, sessionId, projectId, decisions, unfinishedTasks, nextSteps } = body;

  if (!summary || !sessionId || !projectId) {
    return c.json(
      {
        error: '缺少必需参数: summary, sessionId, projectId',
      },
      400
    );
  }

  const storage = getStorage();

  const result = await storage.storeSession({
    summary,
    sessionId,
    projectId,
    decisions: decisions || [],
    unfinishedTasks: unfinishedTasks || [],
    nextSteps: nextSteps || [],
  });

  return c.json({
    success: true,
    data: result,
  });
});

export const sessionRoutes = app;
