import type { Command } from 'commander';
import chalk from 'chalk';
import { createStorage, getProjectId, createSpinner, printSuccess, printError } from '../utils.js';

/**
 * 存储决策命令
 */
export function decisionCommand(program: Command) {
  program
    .command('decision')
    .description('存储架构决策')
    .requiredOption('-q, --question <question>', '决策问题')
    .requiredOption('-o, --options <json>', '选项列表（JSON 格式）')
    .requiredOption('-c, --chosen <name>', '选择的方案')
    .requiredOption('-r, --reason <reason>', '选择理由')
    .option('-p, --project <id>', '项目 ID')
    .option('-T, --tags <tags>', '标签（逗号分隔）')
    .option('-s, --session <id>', '会话 ID')
    .action(async (options) => {
      const spinner = createSpinner('存储决策中...');
      spinner.start();

      try {
        const storage = createStorage();
        const projectId = getProjectId(options.project);

        // 解析选项
        let optionsList;
        try {
          optionsList = JSON.parse(options.options);
          if (!Array.isArray(optionsList)) {
            throw new Error('options 必须是数组');
          }
        } catch (error) {
          throw new Error('无效的选项 JSON 格式');
        }

        // 解析标签
        const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined;

        // 存储决策
        const result = await storage.storeDecision({
          question: options.question,
          options: optionsList,
          chosen: options.chosen,
          reason: options.reason,
          projectId,
          tags,
          sessionId: options.session,
        });

        spinner.succeed();
        printSuccess(`决策已存储: ${chalk.cyan(result.id)}`);
        console.log(`问题: ${options.question}`);
        console.log(`选择: ${chalk.green(options.chosen)}`);
        console.log(`理由: ${options.reason}`);
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
