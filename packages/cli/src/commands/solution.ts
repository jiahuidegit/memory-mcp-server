import type { Command } from 'commander';
import chalk from 'chalk';
import { createStorage, getProjectId, createSpinner, printSuccess, printError } from '../utils.js';

/**
 * 存储解决方案命令
 */
export function solutionCommand(program: Command) {
  program
    .command('solution')
    .description('存储问题解决方案')
    .requiredOption('--problem <problem>', '问题描述')
    .requiredOption('--cause <cause>', '根本原因')
    .requiredOption('--solution <solution>', '解决方案')
    .option('--prevention <prevention>', '预防措施')
    .option('--related <issues>', '关联问题（逗号分隔）')
    .option('-p, --project <id>', '项目 ID')
    .option('-T, --tags <tags>', '标签（逗号分隔）')
    .option('-s, --session <id>', '会话 ID')
    .action(async (options) => {
      const spinner = createSpinner('存储解决方案中...');
      spinner.start();

      try {
        const storage = createStorage();
        const projectId = getProjectId(options.project);

        // 解析标签和关联问题
        const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined;
        const relatedIssues = options.related
          ? options.related.split(',').map((i: string) => i.trim())
          : undefined;

        // 存储解决方案
        const result = await storage.storeSolution({
          problem: options.problem,
          rootCause: options.cause,
          solution: options.solution,
          prevention: options.prevention,
          relatedIssues,
          projectId,
          tags,
          sessionId: options.session,
        });

        spinner.succeed();
        printSuccess(`解决方案已存储: ${chalk.cyan(result.id)}`);
        console.log(`问题: ${options.problem}`);
        console.log(`根因: ${options.cause}`);
        console.log(`方案: ${options.solution}`);
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
