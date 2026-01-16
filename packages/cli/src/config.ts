import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

/**
 * CLI 配置
 */
export interface CLIConfig {
  /** 数据库路径 */
  dbPath: string;
  /** 默认项目 ID */
  defaultProject?: string;
  /** 启用缓存 */
  enableCache: boolean;
  /** 缓存大小 */
  cacheSize: number;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: CLIConfig = {
  dbPath: join(homedir(), '.cms', 'memory.db'),
  enableCache: true,
  cacheSize: 100,
};

/**
 * 配置文件路径（优先级从高到低）
 */
const CONFIG_PATHS = [
  '.cmsrc.json', // 当前目录
  join(process.cwd(), '.cmsrc.json'),
  join(homedir(), '.cmsrc.json'), // 用户主目录
];

/**
 * 加载配置
 */
export function loadConfig(): CLIConfig {
  // 尝试从配置文件加载
  for (const path of CONFIG_PATHS) {
    if (existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf-8');
        const config = JSON.parse(content);
        return { ...DEFAULT_CONFIG, ...config };
      } catch (error) {
        // 忽略解析错误，继续尝试下一个
      }
    }
  }

  // 使用默认配置
  return DEFAULT_CONFIG;
}
