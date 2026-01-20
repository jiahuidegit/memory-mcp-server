import { Hono } from 'hono';
import { getStorage } from '../utils/storage.js';

const app = new Hono();

/**
 * GET /api/project-groups
 * 获取所有项目组
 */
app.get('/', async (c) => {
  const storage = getStorage();

  if (!storage.getAllProjectGroups) {
    return c.json({
      success: false,
      error: '当前存储不支持项目组功能',
    }, 501);
  }

  const groups = await storage.getAllProjectGroups();

  return c.json({
    success: true,
    data: {
      groups,
      total: groups.length,
    },
  });
});

/**
 * GET /api/project-groups/:name
 * 获取单个项目组
 */
app.get('/:name', async (c) => {
  const name = c.req.param('name');
  const storage = getStorage();

  if (!storage.getProjectGroup) {
    return c.json({
      success: false,
      error: '当前存储不支持项目组功能',
    }, 501);
  }

  const group = await storage.getProjectGroup(name);

  if (!group) {
    return c.json({
      success: false,
      error: `项目组 "${name}" 不存在`,
    }, 404);
  }

  return c.json({
    success: true,
    data: group,
  });
});

/**
 * POST /api/project-groups
 * 创建或更新项目组
 * Body: { name: string, projects: string[] }
 */
app.post('/', async (c) => {
  const body = await c.req.json();
  const { name, projects } = body;

  if (!name || !projects || !Array.isArray(projects)) {
    return c.json({
      success: false,
      error: '缺少必要参数：name 和 projects',
    }, 400);
  }

  const storage = getStorage();

  if (!storage.setProjectGroup) {
    return c.json({
      success: false,
      error: '当前存储不支持项目组功能',
    }, 501);
  }

  const result = await storage.setProjectGroup({ name, projects });

  return c.json({
    success: result.success,
    data: {
      name,
      projects,
    },
    message: result.success
      ? `项目组 "${name}" 已保存，包含 ${projects.length} 个项目`
      : '保存失败',
  });
});

/**
 * DELETE /api/project-groups/:name
 * 删除项目组
 */
app.delete('/:name', async (c) => {
  const name = c.req.param('name');
  const storage = getStorage();

  if (!storage.deleteProjectGroup) {
    return c.json({
      success: false,
      error: '当前存储不支持项目组功能',
    }, 501);
  }

  const result = await storage.deleteProjectGroup(name);

  return c.json({
    success: result.success,
    message: result.success
      ? `项目组 "${name}" 已删除`
      : `项目组 "${name}" 删除失败或不存在`,
  });
});

/**
 * GET /api/project-groups/by-project/:projectId
 * 根据项目ID获取所属项目组
 */
app.get('/by-project/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  const storage = getStorage();

  if (!storage.getProjectGroupByProject) {
    return c.json({
      success: false,
      error: '当前存储不支持项目组功能',
    }, 501);
  }

  const group = await storage.getProjectGroupByProject(projectId);

  return c.json({
    success: true,
    data: group,
    message: group
      ? `项目 "${projectId}" 属于项目组 "${group.name}"`
      : `项目 "${projectId}" 不属于任何项目组`,
  });
});

export const projectGroupRoutes = app;
