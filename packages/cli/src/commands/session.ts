import type { Command } from 'commander';
import chalk from 'chalk';
import { createStorage, getProjectId, createSpinner, printSuccess, printError } from '../utils.js';

/**
 * 存储会话命令
 */
export function sessionCommand(program: Command) {
  program
    .command('session')
    .description('存储会话总结')
    .requiredOption('-s, --summary <summary>', '会话总结')
    .requiredOption('-i, --session-id <id>', '会话 ID')
    .option('-p, --project <id>', '项目 ID')
    .option('-d, --decisions <decisions>', '决策列表（逗号分隔）')
    .option('-u, --unfinished <tasks>', '未完成任务（逗号分隔）')
    .option('-n, --next <steps>', '下一步计划（逗号分隔）')
    .action(async (options) => {
      const spinner = createSpinner('存储会话总结中...');
      spinner.start();

      try {
        const storage = createStorage();
        const projectId = getProjectId(options.project);

        // 解析列表
        const decisions = options.decisions
          ? options.decisions.split(',').map((d: string) => d.trim())
          : undefined;
        const unfinishedTasks = options.unfinished
          ? options.unfinished.split(',').map((t: string) => t.trim())
          : undefined;
        const nextSteps = options.next
          ? options.next.split(',').map((s: string) => s.trim())
          : undefined;

        // 存储会话
        const result = await storage.storeSession({
          summary: options.summary,
          decisions,
          unfinishedTasks,
          nextSteps,
          projectId,
          sessionId: options.sessionId,
        });

        spinner.succeed();
        printSuccess(`会话总结已存储: ${chalk.cyan(result.id)}`);
        console.log(`会话: ${options.sessionId}`);
        console.log(`总结: ${options.summary}`);
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
