import { Hono } from 'hono';
import { getStorage } from '../utils/storage.js';

const app = new Hono();

/**
 * GET /api/relations/:memoryId?depth=2
 * 获取记忆关系链
 */
app.get('/:memoryId', async (c) => {
  const memoryId = c.req.param('memoryId');
  const depth = parseInt(c.req.query('depth') || '2', 10);

  const storage = getStorage();

  const result = await storage.getRelations({
    memoryId,
    depth,
  });

  return c.json({
    success: true,
    data: result,
  });
});

export const relationsRoutes = app;
