import { SQLiteStorage } from '@emp/storage';
import { join, dirname } from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

// 计算项目根目录（从 packages/api/src/utils/storage.ts 向上 4 级）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..', '..', '..');

let storageInstance: SQLiteStorage | null = null;

/**
 * 获取存储实例（单例模式）
 */
export function getStorage(): SQLiteStorage {
  if (storageInstance) {
    return storageInstance;
  }

  // 从环境变量获取数据库路径，默认使用项目根目录下的 data 文件夹
  // 优先使用 EMP_DB_PATH（新），兼容 CMS_DB_PATH（旧）
  const dbPath =
    process.env.EMP_DB_PATH ||
    process.env.CMS_DB_PATH ||
    join(PROJECT_ROOT, 'data', 'memory.db');

  // 确保数据库目录存在
  const dbDir = dirname(dbPath);
  try {
    mkdirSync(dbDir, { recursive: true });
  } catch (error) {
    // 目录已存在，忽略
  }

  console.log(`📦 Storage: ${dbPath}`);

  // 创建存储实例
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
