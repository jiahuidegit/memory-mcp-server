import type { Command } from 'commander';
import chalk from 'chalk';
import { createStorage, getProjectId, createSpinner, printMemory, printError } from '../utils.js';
import { SearchStrategy, MemoryType } from '@emp/core';

/**
 * 检索命令
 */
export function recallCommand(program: Command) {
  program
    .command('recall <query>')
    .description('检索记忆')
    .option('-p, --project <id>', '项目 ID')
    .option('-t, --type <type>', '记忆类型过滤')
    .option('-T, --tags <tags>', '标签过滤（逗号分隔）')
    .option('-s, --strategy <strategy>', '检索策略 (exact/fulltext/semantic)', 'exact')
    .option('-l, --limit <number>', '返回数量', '10')
    .option('-d, --details', '显示详细信息', false)
    .action(async (query, options) => {
      const spinner = createSpinner('检索中...');
      spinner.start();

      try {
        const storage = createStorage();

        // 解析参数
        const projectId = options.project ? getProjectId(options.project) : undefined;
        const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined;
        const limit = parseInt(options.limit);

        // 检索
        const result = await storage.recall({
          query,
          projectId,
          type: options.type as MemoryType | undefined,
          tags,
          strategy: options.strategy as SearchStrategy,
          limit,
        });

        spinner.succeed();

        // 显示结果
        if (result.memories.length === 0) {
          console.log(chalk.yellow('\n未找到匹配的记忆'));
          return;
        }

        console.log(
          chalk.bold(
            `\n找到 ${chalk.cyan(result.total)} 条记忆 (策略: ${result.strategy}, 耗时: ${result.took}ms)`
          )
        );

        if (result.metrics?.cacheHit) {
          console.log(chalk.dim('(缓存命中)'));
        }

        result.memories.forEach((memory) => {
          printMemory(memory, options.details);
        });
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
