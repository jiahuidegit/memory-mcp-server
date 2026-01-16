import type { Command } from 'commander';
import chalk from 'chalk';
import { createStorage, getProjectId, createSpinner, printMemory, printError } from '../utils.js';
import { MemoryType } from '@emp/core';

/**
 * 时间线命令
 */
export function timelineCommand(program: Command) {
  program
    .command('timeline')
    .description('查看项目时间线')
    .requiredOption('-p, --project <id>', '项目 ID')
    .option('-t, --type <type>', '记忆类型过滤')
    .option('-l, --limit <number>', '返回数量', '50')
    .option('-d, --details', '显示详细信息', false)
    .action(async (options) => {
      const spinner = createSpinner('加载时间线...');
      spinner.start();

      try {
        const storage = createStorage();
        const projectId = getProjectId(options.project);
        const limit = parseInt(options.limit);

        // 获取时间线
        const result = await storage.getTimeline({
          projectId,
          type: options.type as MemoryType | undefined,
          limit,
        });

        spinner.succeed();

        if (result.entries.length === 0) {
          console.log(chalk.yellow('\n时间线为空'));
          return;
        }

        console.log(chalk.bold(`\n项目时间线: ${chalk.cyan(projectId)}`));
        console.log(chalk.dim(`共 ${result.total} 条记录`));

        result.entries.forEach((entry, idx) => {
          const memory = entry.memory;
          const timestamp = new Date(memory.meta.timestamp);

          console.log(
            chalk.dim(
              `\n${idx + 1}. [${timestamp.toLocaleString('zh-CN')}] ${memory.meta.type}`
            )
          );
          console.log(`   ${memory.content.summary}`);

          if (options.details) {
            printMemory(memory, true);
          }
        });
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
