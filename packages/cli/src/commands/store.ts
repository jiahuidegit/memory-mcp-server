import type { Command } from 'commander';
import chalk from 'chalk';
import { createStorage, getProjectId, createSpinner, printSuccess, printError } from '../utils.js';
import { MemoryType } from '@emp/core';

/**
 * 存储命令
 */
export function storeCommand(program: Command) {
  program
    .command('store')
    .description('存储记忆')
    .requiredOption('-c, --content <content>', '内容摘要')
    .option('-p, --project <id>', '项目 ID')
    .option('-t, --type <type>', '记忆类型 (decision/solution/config/code/error/session)', 'code')
    .option('-T, --tags <tags>', '标签（逗号分隔）')
    .option('-s, --session <id>', '会话 ID')
    .option('-d, --data <json>', '原始数据（JSON 格式）')
    .action(async (options) => {
      const spinner = createSpinner('存储记忆中...');
      spinner.start();

      try {
        const storage = createStorage();
        const projectId = getProjectId(options.project);

        // 解析原始数据
        let rawContext: Record<string, unknown> = {};
        if (options.data) {
          try {
            rawContext = JSON.parse(options.data);
          } catch (error) {
            throw new Error('无效的 JSON 数据');
          }
        }

        // 解析标签
        const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];

        // 存储
        const result = await storage.store({
          content: options.content,
          rawContext,
          projectId,
          type: options.type as MemoryType,
          tags,
          sessionId: options.session,
        });

        spinner.succeed();
        printSuccess(`记忆已存储: ${chalk.cyan(result.id)}`);
        console.log(`项目: ${chalk.cyan(projectId)}`);
        console.log(`类型: ${options.type}`);
        if (tags.length > 0) {
          console.log(`标签: ${tags.join(', ')}`);
        }
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
