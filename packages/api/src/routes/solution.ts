import { Hono } from 'hono';
import { getStorage } from '../utils/storage.js';

const app = new Hono();

/**
 * POST /api/solutions
 * 存储解决方案
 */
app.post('/', async (c) => {
  const body = await c.req.json();

  const { problem, rootCause, solution, prevention, relatedIssues, projectId, tags, sessionId } =
    body;

  if (!problem || !rootCause || !solution || !projectId) {
    return c.json(
      {
        error: '缺少必需参数: problem, rootCause, solution, projectId',
      },
      400
    );
  }

  const storage = getStorage();

  const result = await storage.storeSolution({
    problem,
    rootCause,
    solution,
    prevention,
    relatedIssues: relatedIssues || [],
    projectId,
    tags: tags || [],
    sessionId,
  });

  return c.json({
    success: true,
    data: result,
  });
});

export const solutionRoutes = app;
