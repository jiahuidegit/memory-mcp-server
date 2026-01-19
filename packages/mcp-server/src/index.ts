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
} from '@emp/core';
import { SearchStrategy } from '@emp/core';
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

// 定义工具列表
const tools: Tool[] = [
  {
    name: 'mpulse_store',
    description: '智能存储记忆，AI 自动分类和结构化',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'AI 总结的内容',
        },
        rawContext: {
          type: 'object',
          description: '完整原始数据（不压缩）',
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
      },
      required: ['content', 'rawContext', 'projectId'],
    },
  },
  {
    name: 'mpulse_store_decision',
    description: '存储架构决策（强制字段，防止 AI 偷懒）',
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
      },
      required: ['question', 'options', 'chosen', 'reason', 'projectId'],
    },
  },
  {
    name: 'mpulse_store_solution',
    description: '存储问题解决方案',
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
      },
      required: ['problem', 'rootCause', 'solution', 'projectId'],
    },
  },
  {
    name: 'mpulse_store_session',
    description: '存储会话总结（会话结束时调用）',
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
      },
      required: ['summary', 'projectId', 'sessionId'],
    },
  },
  {
    name: 'mpulse_recall',
    description: '检索记忆（全文搜索，AI 自己理解结果语义）',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '查询内容',
        },
        projectId: {
          type: 'string',
          description: '项目 ID',
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
        const result = await storage.store({
          content: (args as any).content,
          rawContext: (args as any).rawContext,
          projectId: (args as any).projectId,
          type: (args as any).type,
          tags: (args as any).tags,
          sessionId: (args as any).sessionId,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'mpulse_store_decision': {
        const decisionParams: DecisionContext & {
          projectId: string;
          tags?: string[];
          sessionId?: string;
        } = {
          question: (args as any).question,
          options: (args as any).options,
          chosen: (args as any).chosen,
          reason: (args as any).reason,
          projectId: (args as any).projectId,
          tags: (args as any).tags,
          sessionId: (args as any).sessionId,
        };
        const result = await storage.storeDecision(decisionParams);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'mpulse_store_solution': {
        const solutionParams: SolutionContext & {
          projectId: string;
          tags?: string[];
          sessionId?: string;
          artifacts?: Record<string, string>;
        } = {
          problem: (args as any).problem,
          rootCause: (args as any).rootCause,
          solution: (args as any).solution,
          prevention: (args as any).prevention,
          relatedIssues: (args as any).relatedIssues,
          projectId: (args as any).projectId,
          tags: (args as any).tags,
          sessionId: (args as any).sessionId,
          artifacts: (args as any).artifacts,
        };
        const result = await storage.storeSolution(solutionParams);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'mpulse_store_session': {
        const sessionParams: SessionContext & {
          projectId: string;
          sessionId: string;
        } = {
          summary: (args as any).summary,
          decisions: (args as any).decisions,
          unfinishedTasks: (args as any).unfinishedTasks,
          nextSteps: (args as any).nextSteps,
          projectId: (args as any).projectId,
          sessionId: (args as any).sessionId,
        };
        const result = await storage.storeSession(sessionParams);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'mpulse_recall': {
        const query = (args as any).query;
        const strategy = (args as any).strategy || 'fulltext';

        // 构建检索过滤器
        const filters: SearchFilters = {
          query,
          projectId: (args as any).projectId,
          type: (args as any).type,
          tags: (args as any).tags,
          strategy: strategy as any,
          limit: (args as any).limit,
        };

        const result = await storage.recall(filters);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
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
