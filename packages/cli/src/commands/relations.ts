import type { Command } from 'commander';
import chalk from 'chalk';
import { createStorage, createSpinner, printMemory, printError } from '../utils.js';

/**
 * 关系链命令
 */
export function relationsCommand(program: Command) {
  program
    .command('relations <memoryId>')
    .description('查看记忆的关系链')
    .option('-d, --depth <number>', '递归深度', '2')
    .action(async (memoryId, options) => {
      const spinner = createSpinner('查询关系链...');
      spinner.start();

      try {
        const storage = createStorage();
        const depth = parseInt(options.depth);

        // 获取关系链
        const result = await storage.getRelations({
          memoryId,
          depth,
        });

        spinner.succeed();

        console.log(chalk.bold('\n记忆关系链:'));
        console.log(chalk.cyan(`根节点: ${memoryId}`));

        // 打印根记忆
        printMemory(result.memory, true);

        // 递归打印关系
        function printRelations(node: any, level: number = 1) {
          if (!node.related || node.related.length === 0) return;

          node.related.forEach((relatedNode: any) => {
            const indent = '  '.repeat(level);
            console.log(chalk.dim(`\n${indent}↳ 关联记忆:`));
            console.log(`${indent}  ID: ${relatedNode.memory.meta.id}`);
            console.log(`${indent}  摘要: ${relatedNode.memory.content.summary}`);

            // 继续递归
            if (level < depth) {
              printRelations(relatedNode, level + 1);
            }
          });
        }

        printRelations(result);
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
