import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SQLiteStorage, PostgreSQLStorage } from '@emp/storage';
import type {
  IStorage,
  DecisionContext,
  SolutionContext,
  SessionContext,
  SearchFilters,
  TimelineOptions,
  RelationsOptions,
  Memory,
  ProjectGroupConfig,
} from '@emp/core';
import {
  SearchStrategy,
  // 自动关联相关
  extractKeywords,
  findRelatedMemories,
  generateAutoRelations,
  inferProjectGroup,
  getProjectGroupMembers,
} from '@emp/core';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';

/**
 * Memory Pulse (记忆脉搏) MCP Server
 *
 * 提供以下工具：
 * - mpulse_store: 智能存储
 * - mpulse_store_decision: 存储决策
 * - mpulse_store_solution: 存储解决方案
 * - mpulse_store_session: 存储会话
 * - mpulse_recall: 检索记忆（全文搜索，AI 自己理解语义）
 * - mpulse_timeline: 时间线视图
 * - mpulse_relations: 关系链查询
 */

const server = new Server(
  {
    name: 'elb-memory-pulse',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// 存储类型：sqlite（默认） 或 postgresql
const storageType = process.env.MEMORY_STORAGE || 'sqlite';

// 获取当前文件目录（用于定位 prisma schema）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 运行时配置文件路径（供 API Server 读取）
const RUNTIME_CONFIG_PATH = join(homedir(), '.emp', 'runtime-config.json');

/**
 * 写入运行时配置，供 API Server 读取
 * 这样用户只需在 MCP 配置中设置数据库参数，Web Dashboard 自动跟随
 */
function writeRuntimeConfig(config: {
  storageType: string;
  databaseUrl?: string;
  dbPath?: string;
}) {
  try {
    const configDir = dirname(RUNTIME_CONFIG_PATH);
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      RUNTIME_CONFIG_PATH,
      JSON.stringify(
        {
          ...config,
          updatedAt: new Date().toISOString(),
          pid: process.pid,
        },
        null,
        2
      )
    );
    console.error(`📝 运行时配置已写入: ${RUNTIME_CONFIG_PATH}`);
  } catch (error) {
    console.error('⚠️ 写入运行时配置失败:', (error as Error).message);
  }
}

// 初始化存储
function createStorage(): IStorage {
  if (storageType === 'postgresql') {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('错误: 使用 PostgreSQL 存储需要设置 DATABASE_URL 环境变量');
      process.exit(1);
    }
    console.error(`Memory Pulse 使用 PostgreSQL 存储: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

    // 自动推送数据库表结构
    try {
      const schemaPath = join(__dirname, '..', 'prisma', 'schema.prisma');
      console.error('📦 正在同步数据库表结构...');
      execSync(`npx prisma db push --schema="${schemaPath}" --skip-generate`, {
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      console.error('✅ 数据库表结构同步完成');
    } catch (error) {
      console.error('⚠️ 数据库表结构同步失败（可能表已存在）:', (error as Error).message);
    }

    // 写入运行时配置，供 API Server 读取
    writeRuntimeConfig({
      storageType: 'postgresql',
      databaseUrl,
    });

    return new PostgreSQLStorage(databaseUrl);
  }

  // SQLite 存储（默认）
  // 默认路径：~/.emp/memory.db，确保 MCP 和 Web Dashboard 使用同一个文件
  const defaultDbPath = join(homedir(), '.emp', 'memory.db');
  const dbPath = process.env.MEMORY_DB_PATH || defaultDbPath;

  // 确保目录存在
  const dbDir = dirname(dbPath);
  try {
    mkdirSync(dbDir, { recursive: true });
  } catch (error) {
    // 目录已存在，忽略
  }

  console.error(`Memory Pulse 使用 SQLite 存储: ${dbPath}`);

  // 写入运行时配置，供 API Server 读取
  writeRuntimeConfig({
    storageType: 'sqlite',
    dbPath,
  });

  return new SQLiteStorage(dbPath);
}

const storage = createStorage();

/**
 * 自动关联辅助函数
 * 存储记忆后自动建立关联关系
 */
async function processAutoRelations(
  newMemoryId: string,
  projectId: string,
  content: string,
  rawContext?: Record<string, unknown>
): Promise<{ relationsCreated: number }> {
  try {
    // 1. 提取关键词
    const keywords = extractKeywords(content, rawContext);
    if (keywords.length === 0) {
      return { relationsCreated: 0 };
    }

    // 2. 获取项目组成员（支持跨项目关联）
    let projectIds = [projectId];

    // 尝试从存储获取配置的项目组
    if (storage.getProjectGroupByProject) {
      const group = await storage.getProjectGroupByProject(projectId);
      if (group) {
        projectIds = group.projects;
      } else {
        // 尝试自动推断项目组
        const inferredGroup = inferProjectGroup(projectId);
        if (inferredGroup && storage.getAllProjectGroups) {
          const allGroups = await storage.getAllProjectGroups();
          // 找同组的其他项目
          const sameGroupProjects = allGroups
            .filter(g => g.projects.some(p => inferProjectGroup(p) === inferredGroup))
            .flatMap(g => g.projects);
          if (sameGroupProjects.length > 0) {
            projectIds = [...new Set([projectId, ...sameGroupProjects])];
          }
        }
      }
    }

    // 3. 搜索候选记忆
    if (!storage.searchCandidates) {
      return { relationsCreated: 0 };
    }

    const candidates = await storage.searchCandidates({
      keywords,
      projectIds,
      excludeId: newMemoryId,
      limit: 50, // 搜索更多候选以提高关联质量
    });

    if (candidates.length === 0) {
      return { relationsCreated: 0 };
    }

    // 4. 获取新存储的记忆详情
    const newMemory = await storage.getById(newMemoryId);
    if (!newMemory) {
      return { relationsCreated: 0 };
    }

    // 5. 计算相似度并筛选关联
    const relatedCandidates = findRelatedMemories(newMemory, candidates, {
      threshold: 0.3, // 相似度阈值
      maxRelations: 10, // 最多关联 10 条
      crossProject: true,
    });

    if (relatedCandidates.length === 0) {
      return { relationsCreated: 0 };
    }

    // 6. 生成并存储关联关系
    const relations = generateAutoRelations(newMemoryId, relatedCandidates);

    if (storage.createRelations && relations.length > 0) {
      const result = await storage.createRelations(relations);
      return { relationsCreated: result.count };
    }

    return { relationsCreated: 0 };
  } catch (error) {
    // 自动关联失败不影响主流程
    console.error('自动关联处理失败:', error);
    return { relationsCreated: 0 };
  }
}

/**
 * 获取项目组的所有项目 ID
 * 用于跨项目检索
 */
async function getProjectGroupProjectIds(projectId: string): Promise<string[]> {
  try {
    // 1. 尝试获取配置的项目组
    if (storage.getProjectGroupByProject) {
      const group = await storage.getProjectGroupByProject(projectId);
      if (group) {
        return group.projects;
      }
    }

    // 2. 尝试自动推断
    const inferredGroup = inferProjectGroup(projectId);
    if (inferredGroup && storage.getAllProjectGroups) {
      const allGroups = await storage.getAllProjectGroups();
      for (const group of allGroups) {
        if (group.projects.some(p => inferProjectGroup(p) === inferredGroup)) {
          return group.projects;
        }
      }
    }

    // 3. 返回单个项目
    return [projectId];
  } catch (error) {
    console.error('获取项目组失败:', error);
    return [projectId];
  }
}

/**
 * 扩展检索结果的关系链
 */
async function expandRelationChain(
  memories: Memory[],
  depth: number = 1
): Promise<Memory[]> {
  if (depth <= 0 || memories.length === 0) {
    return [];
  }

  try {
    const relatedMemories: Memory[] = [];
    const seenIds = new Set(memories.map(m => m.meta?.id));

    for (const memory of memories) {
      const memoryId = memory.meta?.id;
      if (!memoryId) continue;

      // 获取该记忆的关联
      if (storage.getMemoryRelations) {
        const relations = await storage.getMemoryRelations(memoryId, {
          includeAutoGenerated: true,
        });

        for (const relation of relations) {
          const targetId = relation.targetId;
          if (!seenIds.has(targetId)) {
            seenIds.add(targetId);
            const relatedMemory = await storage.getById(targetId);
            if (relatedMemory) {
              relatedMemories.push(relatedMemory);
            }
          }
        }
      }
    }

    return relatedMemories;
  } catch (error) {
    console.error('扩展关系链失败:', error);
    return [];
  }
}

// 定义工具列表
const tools: Tool[] = [
  {
    name: 'mpulse_store',
    description: `智能存储记忆。三个核心字段必须分别填写不同内容!

【🔴 强制要求】存储前必须先用 mpulse_recall 检索相关记忆，然后通过 relations 字段关联！
- 如果是对已有记忆的更新/修正 → 使用 replaces
- 如果与已有记忆相关 → 使用 relatedTo
- 如果会影响已有记忆 → 使用 impacts
- 如果基于已有记忆派生 → 使用 derivedFrom

核心字段：
- content: 简洁摘要（1-2句话），用于列表展示
- data: 关键结构化数据，提取的重要信息（精简版）
- rawContext: 完整原始数据，包括所有细节（完整版）
- relations: 【必填】关联的记忆 ID`,
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: '简洁摘要（1-2句话），仅用于快速浏览。例如："配置了 PostgreSQL 数据库连接"',
        },
        data: {
          type: 'object',
          description: `关键结构化数据对象，提取的重要信息（精简版）。例如：
- 配置类：{ host, port, database, user }
- 决策类：{ chosen, reason }
- 问题类：{ error, solution }
【重要】只保留关键字段，便于快速查看！`,
        },
        rawContext: {
          type: 'object',
          description: `完整原始数据对象，必须包含所有细节（完整版）！包括但不限于：
- 完整的命令输出和错误信息
- 具体的配置值、端口、路径
- 文件内容和代码片段
- 磁盘空间、内存使用等运行时数据
- 对话中提到的所有具体数值和参数
【重要】此字段是原始数据存档，不要压缩或省略任何信息！`,
        },
        projectId: {
          type: 'string',
          description: '项目 ID',
        },
        type: {
          type: 'string',
          enum: ['decision', 'solution', 'config', 'code', 'error', 'session'],
          description: '记忆类型（可选，不填则默认为 code）',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: '标签',
        },
        sessionId: {
          type: 'string',
          description: '会话 ID（可选）',
        },
        relations: {
          type: 'object',
          description: `【🔴 强制要求】记忆关联，存储前必须先检索相关记忆并关联！
- relatedTo: 与这些记忆相关（如：同一功能的不同方面）
- replaces: 替代/更新这些记忆（如：配置变更、方案修正）
- impacts: 影响这些记忆（如：架构变更影响多个模块）
- derivedFrom: 基于某条记忆派生（如：基于决策的具体实现）
如果确实没有相关记忆，设置为空对象 {}`,
          properties: {
            relatedTo: {
              type: 'array',
              items: { type: 'string' },
              description: '关联的记忆 ID 列表',
            },
            replaces: {
              type: 'array',
              items: { type: 'string' },
              description: '替代的记忆 ID 列表',
            },
            impacts: {
              type: 'array',
              items: { type: 'string' },
              description: '影响的记忆 ID 列表',
            },
            derivedFrom: {
              type: 'string',
              description: '派生自的记忆 ID',
            },
          },
        },
      },
      required: ['content', 'data', 'rawContext', 'projectId', 'relations'],
    },
  },
  {
    name: 'mpulse_store_decision',
    description: `存储架构决策（强制字段，防止 AI 偷懒）

【🔴 强制要求】存储前必须先用 mpulse_recall 检索相关决策，然后通过 relations 字段关联！
- 如果是对已有决策的修正 → 使用 replaces
- 如果与已有决策相关 → 使用 relatedTo
- 如果会影响已有决策 → 使用 impacts`,
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: '决策问题',
        },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'pros', 'cons'],
          },
          description: '考虑的选项',
        },
        chosen: {
          type: 'string',
          description: '选择的方案',
        },
        reason: {
          type: 'string',
          description: '选择理由',
        },
        projectId: {
          type: 'string',
          description: '项目 ID',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: '标签',
        },
        sessionId: {
          type: 'string',
          description: '会话 ID（可选）',
        },
        relations: {
          type: 'object',
          description: `【🔴 强制要求】记忆关联，存储前必须先检索相关决策并关联！
如果确实没有相关记忆，设置为空对象 {}`,
          properties: {
            relatedTo: {
              type: 'array',
              items: { type: 'string' },
              description: '关联的记忆 ID 列表',
            },
            replaces: {
              type: 'array',
              items: { type: 'string' },
              description: '替代的记忆 ID 列表',
            },
            impacts: {
              type: 'array',
              items: { type: 'string' },
              description: '影响的记忆 ID 列表',
            },
            derivedFrom: {
              type: 'string',
              description: '派生自的记忆 ID',
            },
          },
        },
      },
      required: ['question', 'options', 'chosen', 'reason', 'projectId', 'relations'],
    },
  },
  {
    name: 'mpulse_store_solution',
    description: `存储问题解决方案

【🔴 强制要求】存储前必须先用 mpulse_recall 检索相关问题/方案，然后通过 relations 字段关联！
- 如果是对已有方案的改进 → 使用 replaces
- 如果与已有问题/方案相关 → 使用 relatedTo
- 如果基于某个决策实现 → 使用 derivedFrom`,
    inputSchema: {
      type: 'object',
      properties: {
        problem: {
          type: 'string',
          description: '问题描述',
        },
        rootCause: {
          type: 'string',
          description: '根因分析',
        },
        solution: {
          type: 'string',
          description: '解决方案',
        },
        prevention: {
          type: 'string',
          description: '如何预防',
        },
        relatedIssues: {
          type: 'array',
          items: { type: 'string' },
          description: '关联问题',
        },
        projectId: {
          type: 'string',
          description: '项目 ID',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: '标签',
        },
        sessionId: {
          type: 'string',
          description: '会话 ID（可选）',
        },
        artifacts: {
          type: 'object',
          description: '相关文件（代码片段等）',
        },
        relations: {
          type: 'object',
          description: `【🔴 强制要求】记忆关联，存储前必须先检索相关问题/方案并关联！
如果确实没有相关记忆，设置为空对象 {}`,
          properties: {
            relatedTo: {
              type: 'array',
              items: { type: 'string' },
              description: '关联的记忆 ID 列表',
            },
            replaces: {
              type: 'array',
              items: { type: 'string' },
              description: '替代的记忆 ID 列表',
            },
            impacts: {
              type: 'array',
              items: { type: 'string' },
              description: '影响的记忆 ID 列表',
            },
            derivedFrom: {
              type: 'string',
              description: '派生自的记忆 ID',
            },
          },
        },
      },
      required: ['problem', 'rootCause', 'solution', 'projectId', 'relations'],
    },
  },
  {
    name: 'mpulse_store_session',
    description: `存储会话总结（会话结束时调用）

【🔴 强制要求】存储前必须关联本次会话中产生的所有记忆！
- 使用 relatedTo 关联本次会话中存储的所有决策、方案、配置等记忆
- 如果是上一次会话的延续 → 使用 derivedFrom 关联上次会话记忆`,
    inputSchema: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: '本次会话总结',
        },
        decisions: {
          type: 'array',
          items: { type: 'string' },
          description: '本次做出的决策',
        },
        unfinishedTasks: {
          type: 'array',
          items: { type: 'string' },
          description: '未完成的任务',
        },
        nextSteps: {
          type: 'array',
          items: { type: 'string' },
          description: '下次从哪继续',
        },
        projectId: {
          type: 'string',
          description: '项目 ID',
        },
        sessionId: {
          type: 'string',
          description: '会话 ID',
        },
        relations: {
          type: 'object',
          description: `【🔴 强制要求】记忆关联！
- relatedTo: 本次会话中存储的所有记忆 ID
- derivedFrom: 如果是延续上次会话，填上次会话记忆 ID
如果确实没有相关记忆，设置为空对象 {}`,
          properties: {
            relatedTo: {
              type: 'array',
              items: { type: 'string' },
              description: '关联的记忆 ID 列表（本次会话产生的记忆）',
            },
            replaces: {
              type: 'array',
              items: { type: 'string' },
              description: '替代的记忆 ID 列表',
            },
            impacts: {
              type: 'array',
              items: { type: 'string' },
              description: '影响的记忆 ID 列表',
            },
            derivedFrom: {
              type: 'string',
              description: '派生自的记忆 ID（上次会话）',
            },
          },
        },
      },
      required: ['summary', 'projectId', 'sessionId', 'relations'],
    },
  },
  {
    name: 'mpulse_recall',
    description: `【🚨 最高优先级 - 会话启动时必须首先调用此工具】

⛔ 禁止在调用此工具之前执行任何操作：
- 禁止使用 Bash 命令（ls、find、grep 等）
- 禁止使用 Glob、Read、Grep 等文件操作工具
- 禁止搜索或浏览文件系统

✅ 正确流程：
1. 会话开始 → 立即调用 mpulse_recall
2. 从工作目录提取 projectId（最后一级文件夹名）
3. 查询关键词："项目上下文 架构决策 未完成任务 配置信息"
4. 分析返回结果后再执行其他操作

🔗 智能关联功能：
- 自动跨项目搜索：如果项目在同一项目组（如 frontend/backend），会自动搜索所有关联项目
- 关系链扩展：默认返回相关联的记忆，设置 expandRelations: true 可获取更深层关联
- 结果说明：memories 是直接匹配，relatedMemories 是通过关系链扩展的关联记忆

调用示例：
mpulse_recall({
  query: "项目上下文 架构决策 未完成任务",
  projectId: "从工作目录提取的项目名",
  expandRelations: true
})

返回内容：历史决策、已解决问题、配置信息、未完成任务、关联记忆等`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '查询内容',
        },
        projectId: {
          type: 'string',
          description: '项目 ID（会自动扩展到项目组内所有项目）',
        },
        type: {
          type: 'string',
          enum: ['decision', 'solution', 'config', 'code', 'error', 'session'],
          description: '记忆类型',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: '标签过滤',
        },
        strategy: {
          type: 'string',
          enum: ['exact', 'fulltext', 'auto'],
          description: '检索策略（默认 fulltext 全文搜索）',
        },
        limit: {
          type: 'number',
          description: '返回数量',
        },
        expandRelations: {
          type: 'boolean',
          description: '是否扩展关系链（默认 true）',
        },
        relationDepth: {
          type: 'number',
          description: '关系链扩展深度（默认 1）',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'mpulse_timeline',
    description: '查看项目的时间线视图',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: '项目 ID',
        },
        dateRange: {
          type: 'array',
          items: { type: 'string' },
          description: '日期范围 [start, end]',
        },
        type: {
          type: 'string',
          enum: ['decision', 'solution', 'config', 'code', 'error', 'session'],
          description: '记忆类型',
        },
        limit: {
          type: 'number',
          description: '返回数量',
        },
        offset: {
          type: 'number',
          description: '分页偏移',
        },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'mpulse_relations',
    description: '查询记忆的关系链',
    inputSchema: {
      type: 'object',
      properties: {
        memoryId: {
          type: 'string',
          description: '记忆 ID',
        },
        depth: {
          type: 'number',
          description: '递归深度',
        },
      },
      required: ['memoryId'],
    },
  },
  // ========== 项目组管理工具 ==========
  {
    name: 'mpulse_set_project_group',
    description: `设置项目组，将相关项目关联在一起。
关联后，检索时会自动跨项目搜索，存储时会自动建立跨项目关联。
例如：将 myapp-frontend 和 myapp-backend 关联为一个项目组。`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '项目组名称（如 myapp）',
        },
        projects: {
          type: 'array',
          items: { type: 'string' },
          description: '项目 ID 列表（如 ["myapp-frontend", "myapp-backend", "myapp-api"]）',
        },
      },
      required: ['name', 'projects'],
    },
  },
  {
    name: 'mpulse_get_project_groups',
    description: '获取所有项目组配置',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'mpulse_delete_project_group',
    description: '删除项目组',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '项目组名称',
        },
      },
      required: ['name'],
    },
  },
];

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// 注册资源列表
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'memory://projects',
      name: '所有项目记忆',
      description: '列出所有项目 ID',
      mimeType: 'application/json',
    },
  ],
}));

// 处理资源读取
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  try {
    // memory://projects - 列出所有项目
    if (uri === 'memory://projects') {
      // 查询所有记忆，按项目分组
      const allMemories = await storage.recall({ query: '', limit: 10000 });
      const projects = new Set(allMemories.memories.map((m) => m.meta.projectId));

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                projects: Array.from(projects),
                total: projects.size,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // memory://project/{projectId} - 列出项目的所有记忆
    const projectMatch = uri.match(/^memory:\/\/project\/(.+)$/);
    if (projectMatch) {
      const projectId = decodeURIComponent(projectMatch[1]);
      const result = await storage.recall({ query: '', projectId, limit: 1000 });

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                projectId,
                memories: result.memories,
                total: result.total,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // memory://memory/{memoryId} - 获取单个记忆详情
    const memoryMatch = uri.match(/^memory:\/\/memory\/(.+)$/);
    if (memoryMatch) {
      const memoryId = decodeURIComponent(memoryMatch[1]);
      // 使用 getRelations 获取单个记忆（depth=0 不递归）
      const result = await storage.getRelations({ memoryId, depth: 0 });

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(result.memory, null, 2),
          },
        ],
      };
    }

    // memory://session/{sessionId} - 列出会话的所有记忆
    const sessionMatch = uri.match(/^memory:\/\/session\/(.+)$/);
    if (sessionMatch) {
      const sessionId = decodeURIComponent(sessionMatch[1]);
      const result = await storage.recall({ query: '', sessionId, limit: 1000 });

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                sessionId,
                memories: result.memories,
                total: result.total,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    throw new Error(`Unknown resource URI: ${uri}`);
  } catch (error) {
    throw new Error(
      `Failed to read resource ${uri}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// 注册提示词列表
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: 'analyze-decision',
      description: '分析项目中的架构决策',
      arguments: [
        {
          name: 'projectId',
          description: '项目 ID',
          required: true,
        },
      ],
    },
    {
      name: 'summarize-session',
      description: '总结会话中的工作内容',
      arguments: [
        {
          name: 'sessionId',
          description: '会话 ID',
          required: true,
        },
      ],
    },
    {
      name: 'find-related',
      description: '查找与特定主题相关的记忆',
      arguments: [
        {
          name: 'topic',
          description: '主题关键词',
          required: true,
        },
        {
          name: 'projectId',
          description: '项目 ID（可选）',
          required: false,
        },
      ],
    },
    {
      name: 'review-project',
      description: '回顾项目的发展历程',
      arguments: [
        {
          name: 'projectId',
          description: '项目 ID',
          required: true,
        },
        {
          name: 'type',
          description: '记忆类型（可选：decision, solution, session）',
          required: false,
        },
      ],
    },
  ],
}));

// 处理提示词获取
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('Missing required arguments');
  }

  try {
    switch (name) {
      case 'analyze-decision': {
        const projectId = (args as any).projectId;
        const decisions = await storage.recall({
          query: '',
          projectId,
          type: 'decision' as any,
          limit: 100,
        });

        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `请分析项目 "${projectId}" 中的架构决策。

找到了 ${decisions.total} 个决策记录：

${decisions.memories
  .map((m, idx) => {
    const data = m.content.data as any;
    return `
${idx + 1}. ${data.question || m.content.summary}
   选择：${data.chosen || '未知'}
   理由：${data.reason || '未提供'}
   时间：${m.meta.timestamp}
`;
  })
  .join('\n')}

请总结：
1. 主要的技术选型有哪些？
2. 决策的演进趋势如何？
3. 是否存在可能的技术债务？
4. 有哪些值得记录的经验教训？`,
              },
            },
          ],
        };
      }

      case 'summarize-session': {
        const sessionId = (args as any).sessionId;
        const memories = await storage.recall({
          query: '',
          sessionId,
          limit: 100,
        });

        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `请总结会话 "${sessionId}" 的工作内容。

会话包含 ${memories.total} 条记忆：

${memories.memories
  .map((m, idx) => `${idx + 1}. [${m.meta.type}] ${m.content.summary}`)
  .join('\n')}

请生成一个简洁的工作总结，包括：
1. 主要完成的任务
2. 做出的重要决策
3. 遇到的问题和解决方案
4. 未完成的任务（如有）
5. 下一步计划建议`,
              },
            },
          ],
        };
      }

      case 'find-related': {
        const topic = (args as any).topic;
        const projectId = (args as any).projectId;
        const related = await storage.recall({
          query: topic,
          projectId,
          limit: 20,
        });

        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `查找与 "${topic}" 相关的记忆${projectId ? `（项目：${projectId}）` : ''}。

找到 ${related.total} 条相关记忆：

${related.memories
  .map(
    (m, idx) => `
${idx + 1}. ${m.content.summary}
   类型：${m.meta.type}
   项目：${m.meta.projectId}
   时间：${m.meta.timestamp}
`
  )
  .join('\n')}

请分析这些记忆之间的关联性，并提供：
1. 这些记忆围绕什么主题？
2. 是否存在演进关系？
3. 有哪些有价值的经验可以复用？`,
              },
            },
          ],
        };
      }

      case 'review-project': {
        const projectId = (args as any).projectId;
        const type = (args as any).type;
        const timeline = await storage.getTimeline({
          projectId,
          type: type as any,
          limit: 100,
        });

        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `回顾项目 "${projectId}" 的发展历程${type ? `（类型：${type}）` : ''}。

时间线包含 ${timeline.total} 条记录：

${timeline.entries
  .map((entry, idx) => {
    const m = entry.memory;
    return `${idx + 1}. [${new Date(m.meta.timestamp).toLocaleDateString()}] ${m.content.summary}`;
  })
  .join('\n')}

请生成项目回顾报告，包括：
1. 项目起源和初始目标
2. 关键里程碑和决策点
3. 遇到的挑战和解决方案
4. 当前状态和未来方向
5. 经验总结和改进建议`,
              },
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to generate prompt ${name}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // MCP SDK 保证 args 存在且类型正确（通过 inputSchema 验证）
  if (!args) {
    throw new Error('Missing required arguments');
  }

  try {
    switch (name) {
      case 'mpulse_store': {
        const content = (args as any).content;
        const data = (args as any).data;
        const rawContext = (args as any).rawContext;
        const projectId = (args as any).projectId;
        const relations = (args as any).relations;

        // 1. 存储记忆（包含手动指定的关系）
        const result = await storage.store({
          content,
          data,
          rawContext,
          projectId,
          type: (args as any).type,
          tags: (args as any).tags,
          sessionId: (args as any).sessionId,
          relations,
        });

        // 2. 自动建立关联关系
        let autoRelationResult = { relationsCreated: 0 };
        if (result.success && result.id) {
          autoRelationResult = await processAutoRelations(
            result.id,
            projectId,
            content,
            rawContext
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ...result,
                autoRelations: autoRelationResult.relationsCreated,
              }, null, 2),
            },
          ],
        };
      }

      case 'mpulse_store_decision': {
        const projectId = (args as any).projectId;
        const relations = (args as any).relations;
        const decisionParams: DecisionContext & {
          projectId: string;
          tags?: string[];
          sessionId?: string;
          relations?: {
            replaces?: string[];
            relatedTo?: string[];
            impacts?: string[];
            derivedFrom?: string;
          };
        } = {
          question: (args as any).question,
          options: (args as any).options,
          chosen: (args as any).chosen,
          reason: (args as any).reason,
          projectId,
          tags: (args as any).tags,
          sessionId: (args as any).sessionId,
          relations,
        };
        const result = await storage.storeDecision(decisionParams);

        // 自动建立关联关系
        let autoRelationResult = { relationsCreated: 0 };
        if (result.success && result.id) {
          // 用 question + chosen + reason 作为内容提取关键词
          const content = `${decisionParams.question} ${decisionParams.chosen} ${decisionParams.reason}`;
          autoRelationResult = await processAutoRelations(
            result.id,
            projectId,
            content,
            { options: decisionParams.options }
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ...result,
                autoRelations: autoRelationResult.relationsCreated,
              }, null, 2),
            },
          ],
        };
      }

      case 'mpulse_store_solution': {
        const projectId = (args as any).projectId;
        const relations = (args as any).relations;
        const solutionParams: SolutionContext & {
          projectId: string;
          tags?: string[];
          sessionId?: string;
          artifacts?: Record<string, string>;
          relations?: {
            replaces?: string[];
            relatedTo?: string[];
            impacts?: string[];
            derivedFrom?: string;
          };
        } = {
          problem: (args as any).problem,
          rootCause: (args as any).rootCause,
          solution: (args as any).solution,
          prevention: (args as any).prevention,
          relatedIssues: (args as any).relatedIssues,
          projectId,
          tags: (args as any).tags,
          sessionId: (args as any).sessionId,
          artifacts: (args as any).artifacts,
          relations,
        };
        const result = await storage.storeSolution(solutionParams);

        // 自动建立关联关系
        let autoRelationResult = { relationsCreated: 0 };
        if (result.success && result.id) {
          // 用 problem + rootCause + solution 作为内容提取关键词
          const content = `${solutionParams.problem} ${solutionParams.rootCause} ${solutionParams.solution}`;
          autoRelationResult = await processAutoRelations(
            result.id,
            projectId,
            content,
            { artifacts: solutionParams.artifacts }
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ...result,
                autoRelations: autoRelationResult.relationsCreated,
              }, null, 2),
            },
          ],
        };
      }

      case 'mpulse_store_session': {
        const projectId = (args as any).projectId;
        const relations = (args as any).relations;
        const sessionParams: SessionContext & {
          projectId: string;
          sessionId: string;
          relations?: {
            replaces?: string[];
            relatedTo?: string[];
            impacts?: string[];
            derivedFrom?: string;
          };
        } = {
          summary: (args as any).summary,
          decisions: (args as any).decisions,
          unfinishedTasks: (args as any).unfinishedTasks,
          nextSteps: (args as any).nextSteps,
          projectId,
          sessionId: (args as any).sessionId,
          relations,
        };
        const result = await storage.storeSession(sessionParams);

        // 自动建立关联关系
        let autoRelationResult = { relationsCreated: 0 };
        if (result.success && result.id) {
          // 用 summary 和 decisions 作为内容提取关键词
          const decisionsText = (sessionParams.decisions || []).join(' ');
          const content = `${sessionParams.summary} ${decisionsText}`;
          autoRelationResult = await processAutoRelations(
            result.id,
            projectId,
            content,
            {
              unfinishedTasks: sessionParams.unfinishedTasks,
              nextSteps: sessionParams.nextSteps,
            }
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ...result,
                autoRelations: autoRelationResult.relationsCreated,
              }, null, 2),
            },
          ],
        };
      }

      case 'mpulse_recall': {
        const query = (args as any).query;
        const strategy = (args as any).strategy || 'fulltext';
        const projectId = (args as any).projectId;
        const expandRelations = (args as any).expandRelations !== false; // 默认 true
        const relationDepth = (args as any).relationDepth || 1;

        // 获取项目组成员（跨项目搜索）
        let projectIds: string[] | undefined;
        if (projectId) {
          projectIds = await getProjectGroupProjectIds(projectId);
        }

        // 构建检索过滤器
        const filters: SearchFilters = {
          query,
          // 如果有多个项目，使用 projectIds；否则使用 projectId
          ...(projectIds && projectIds.length > 1
            ? { projectIds }
            : { projectId }),
          type: (args as any).type,
          tags: (args as any).tags,
          strategy: strategy as any,
          limit: (args as any).limit,
          expandRelations,
          relationDepth,
        };

        const result = await storage.recall(filters);

        // 扩展关系链（如果需要且存储层未实现）
        let relatedMemories = result.relatedMemories || [];
        if (expandRelations && relatedMemories.length === 0 && result.memories.length > 0) {
          relatedMemories = await expandRelationChain(result.memories, relationDepth);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ...result,
                relatedMemories,
                projectsSearched: projectIds,
              }, null, 2),
            },
          ],
        };
      }

      case 'mpulse_timeline': {
        const options: TimelineOptions = {
          projectId: (args as any).projectId,
          dateRange: (args as any).dateRange,
          type: (args as any).type,
          limit: (args as any).limit,
          offset: (args as any).offset,
        };
        const result = await storage.getTimeline(options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'mpulse_relations': {
        const options: RelationsOptions = {
          memoryId: (args as any).memoryId,
          depth: (args as any).depth,
        };
        const result = await storage.getRelations(options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // ========== 项目组管理 ==========
      case 'mpulse_set_project_group': {
        const groupConfig: ProjectGroupConfig = {
          name: (args as any).name,
          projects: (args as any).projects,
        };

        if (!storage.setProjectGroup) {
          throw new Error('当前存储不支持项目组功能');
        }

        const result = await storage.setProjectGroup(groupConfig);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ...result,
                group: groupConfig,
                message: `项目组 "${groupConfig.name}" 已设置，包含 ${groupConfig.projects.length} 个项目`,
              }, null, 2),
            },
          ],
        };
      }

      case 'mpulse_get_project_groups': {
        if (!storage.getAllProjectGroups) {
          throw new Error('当前存储不支持项目组功能');
        }

        const groups = await storage.getAllProjectGroups();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                groups,
                total: groups.length,
              }, null, 2),
            },
          ],
        };
      }

      case 'mpulse_delete_project_group': {
        const name = (args as any).name;

        if (!storage.deleteProjectGroup) {
          throw new Error('当前存储不支持项目组功能');
        }

        const result = await storage.deleteProjectGroup(name);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ...result,
                message: result.success
                  ? `项目组 "${name}" 已删除`
                  : `项目组 "${name}" 删除失败或不存在`,
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Memory Pulse (记忆脉搏) MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
