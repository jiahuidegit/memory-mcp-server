import { Hono } from 'hono';
import { getStorage } from '../utils/storage.js';

const app = new Hono();

/**
 * POST /api/decisions
 * 存储决策
 */
app.post('/', async (c) => {
  const body = await c.req.json();

  const { question, options, chosen, reason, projectId, tags, sessionId } = body;

  if (!question || !options || !chosen || !reason || !projectId) {
    return c.json(
      {
        error: '缺少必需参数: question, options, chosen, reason, projectId',
      },
      400
    );
  }

  if (!Array.isArray(options)) {
    return c.json({ error: 'options 必须是数组' }, 400);
  }

  const storage = getStorage();

  const result = await storage.storeDecision({
    question,
    options,
    chosen,
    reason,
    projectId,
    tags: tags || [],
    sessionId,
  });

  return c.json({
    success: true,
    data: result,
  });
});

export const decisionRoutes = app;
