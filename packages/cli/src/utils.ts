import chalk from 'chalk';
import ora from 'ora';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { SQLiteStorage } from '@emp/storage';
import { loadConfig } from './config.js';
import type { Memory } from '@emp/core';

/**
 * 创建存储实例
 */
export function createStorage(): SQLiteStorage {
  const config = loadConfig();

  // 确保数据库目录存在
  const dbDir = dirname(config.dbPath);
  try {
    mkdirSync(dbDir, { recursive: true });
  } catch (error) {
    // 目录已存在，忽略错误
  }

  return new SQLiteStorage(config.dbPath, {
    enableCache: config.enableCache,
    cacheSize: config.cacheSize,
  });
}

/**
 * 获取项目 ID（优先级：参数 > 配置 > 错误）
 */
export function getProjectId(argProjectId?: string): string {
  if (argProjectId) return argProjectId;

  const config = loadConfig();
  if (config.defaultProject) return config.defaultProject;

  throw new Error('缺少项目 ID，请使用 --project 参数或在配置文件中设置 defaultProject');
}

/**
 * 创建 spinner
 */
export function createSpinner(text: string) {
  return ora({
    text,
    color: 'cyan',
  });
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化记忆类型
 */
export function formatType(type: string): string {
  const typeMap: Record<string, string> = {
    decision: chalk.blue('决策'),
    solution: chalk.green('解决方案'),
    config: chalk.yellow('配置'),
    code: chalk.magenta('代码'),
    error: chalk.red('错误'),
    session: chalk.cyan('会话'),
  };
  return typeMap[type] || type;
}

/**
 * 打印记忆详情
 */
export function printMemory(memory: Memory, showDetails: boolean = false) {
  console.log(chalk.bold(`\n[${memory.meta.id}]`));
  console.log(`类型: ${formatType(memory.meta.type)}`);
  console.log(`项目: ${chalk.cyan(memory.meta.projectId)}`);
  console.log(`时间: ${formatTimestamp(memory.meta.timestamp)}`);
  console.log(`摘要: ${memory.content.summary}`);

  if (memory.meta.tags.length > 0) {
    console.log(`标签: ${memory.meta.tags.map((t) => chalk.gray(`#${t}`)).join(' ')}`);
  }

  if (showDetails) {
    console.log(chalk.dim('\n--- 详细数据 ---'));
    console.log(JSON.stringify(memory.content.data, null, 2));

    if (memory.relations.derivedFrom) {
      console.log(chalk.dim(`\n基于: ${memory.relations.derivedFrom}`));
    }
  }
}

/**
 * 打印成功消息
 */
export function printSuccess(message: string) {
  console.log(chalk.green('✓'), message);
}

/**
 * 打印错误消息
 */
export function printError(message: string) {
  console.log(chalk.red('✗'), message);
}

/**
 * 打印表格
 */
export function printTable(headers: string[], rows: string[][]) {
  // 计算每列的最大宽度
  const widths = headers.map((header, i) => {
    const columnValues = [header, ...rows.map((row) => row[i] || '')];
    return Math.max(...columnValues.map((v) => v.length));
  });

  // 打印表头
  const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join(' | ');
  console.log(chalk.bold(headerRow));
  console.log('-'.repeat(headerRow.length));

  // 打印数据行
  rows.forEach((row) => {
    const rowStr = row.map((cell, i) => (cell || '').padEnd(widths[i])).join(' | ');
    console.log(rowStr);
  });
}
