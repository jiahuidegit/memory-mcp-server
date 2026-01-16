import type { Command } from 'commander';
import chalk from 'chalk';
import { createStorage, createSpinner, printSuccess, printError } from '../utils.js';
import { createInterface } from 'readline';

/**
 * 删除记忆命令
 */
export function deleteCommand(program: Command) {
  program
    .command('delete <memoryId>')
    .description('删除记忆')
    .option('-f, --force', '跳过确认', false)
    .action(async (memoryId, options) => {
      try {
        const storage = createStorage();

        // 先获取记忆详情
        let memory;
        try {
          const result = await storage.getRelations({ memoryId, depth: 0 });
          memory = result.memory;
        } catch (error) {
          printError(`记忆不存在: ${memoryId}`);
          process.exit(1);
        }

        // 显示要删除的记忆
        console.log(chalk.yellow('\n即将删除以下记忆:'));
        console.log(`  ID: ${memory.meta.id}`);
        console.log(`  类型: ${memory.meta.type}`);
        console.log(`  项目: ${memory.meta.projectId}`);
        console.log(`  摘要: ${memory.content.summary}`);

        // 确认删除
        if (!options.force) {
          const confirmed = await confirmDelete();
          if (!confirmed) {
            console.log(chalk.dim('\n已取消'));
            return;
          }
        }

        const spinner = createSpinner('删除中...');
        spinner.start();

        const result = await storage.delete(memoryId);

        if (result.success) {
          spinner.succeed();
          printSuccess(`记忆已删除: ${memoryId}`);
        } else {
          spinner.fail();
          printError('删除失败');
          process.exit(1);
        }
      } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

/**
 * 确认删除
 */
function confirmDelete(): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(chalk.red('\n确认删除? (y/N): '), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}
