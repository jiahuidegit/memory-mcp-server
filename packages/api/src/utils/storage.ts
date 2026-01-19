import { SQLiteStorage, PostgreSQLStorage } from '@emp/storage';
import type { IStorage } from '@emp/core';
import { join, dirname } from 'path';
import { mkdirSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

// 计算项目根目录（从 packages/api/src/utils/storage.ts 向上 4 级）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..', '..', '..');

// MCP Server 写入的运行时配置路径
const RUNTIME_CONFIG_PATH = join(homedir(), '.emp', 'runtime-config.json');

/**
 * 运行时配置接口
 */
interface RuntimeConfig {
  storageType: string;
  databaseUrl?: string;
  dbPath?: string;
  updatedAt?: string;
  pid?: number;
}

/**
 * 读取 MCP Server 写入的运行时配置
 * 这样 API Server 可以自动连接同一个数据库
 */
function readRuntimeConfig(): RuntimeConfig | null {
  try {
    if (existsSync(RUNTIME_CONFIG_PATH)) {
      const content = readFileSync(RUNTIME_CONFIG_PATH, 'utf-8');
      const config = JSON.parse(content) as RuntimeConfig;
      console.log(`📖 读取运行时配置: ${RUNTIME_CONFIG_PATH}`);
      return config;
    }
  } catch (error) {
    console.warn('⚠️ 读取运行时配置失败:', (error as Error).message);
  }
  return null;
}

let storageInstance: IStorage | null = null;

/**
 * 获取存储实例（单例模式）
 * 优先级：
 * 1. 环境变量（直接指定）
 * 2. MCP 运行时配置（~/.emp/runtime-config.json）
 * 3. 默认值（SQLite）
 */
export function getStorage(): IStorage {
  if (storageInstance) {
    return storageInstance;
  }

  // 先尝试读取 MCP 的运行时配置
  const runtimeConfig = readRuntimeConfig();

  // 存储类型优先级：环境变量 > 运行时配置 > 默认值
  const storageType = process.env.MEMORY_STORAGE || runtimeConfig?.storageType || 'sqlite';

  if (storageType === 'postgresql') {
    // 数据库 URL 优先级：环境变量 > 运行时配置
    const databaseUrl = process.env.DATABASE_URL || runtimeConfig?.databaseUrl;
    if (!databaseUrl) {
      console.error('错误: 使用 PostgreSQL 存储需要设置 DATABASE_URL 环境变量或启动 MCP Server');
      process.exit(1);
    }
    console.log(`📦 Storage: PostgreSQL (${databaseUrl.replace(/:[^:@]+@/, ':****@')})`);
    if (runtimeConfig?.databaseUrl === databaseUrl) {
      console.log('   └─ 配置来源: MCP 运行时配置');
    }
    storageInstance = new PostgreSQLStorage(databaseUrl);
    return storageInstance;
  }

  // SQLite 存储（默认）
  // 路径优先级：环境变量 > 运行时配置 > 默认值（~/.emp/memory.db）
  const defaultDbPath = join(homedir(), '.emp', 'memory.db');
  const dbPath =
    process.env.EMP_DB_PATH ||
    process.env.CMS_DB_PATH ||
    runtimeConfig?.dbPath ||
    defaultDbPath;

  // 确保数据库目录存在
  const dbDir = dirname(dbPath);
  try {
    mkdirSync(dbDir, { recursive: true });
  } catch (error) {
    // 目录已存在，忽略
  }

  console.log(`📦 Storage: SQLite (${dbPath})`);
  if (runtimeConfig?.dbPath === dbPath) {
    console.log('   └─ 配置来源: MCP 运行时配置');
  }

  storageInstance = new SQLiteStorage(dbPath, {
    enableCache: process.env.EMP_ENABLE_CACHE !== 'false',
    cacheSize: parseInt(process.env.EMP_CACHE_SIZE || '100', 10),
  });

  return storageInstance;
}

/**
 * 关闭存储实例
 */
export function closeStorage() {
  if (storageInstance) {
    storageInstance = null;
  }
}
