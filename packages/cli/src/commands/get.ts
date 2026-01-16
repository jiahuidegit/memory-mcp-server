import type { Command } from 'commander';
import chalk from 'chalk';
import { createStorage, createSpinner, printMemory, printError } from '../utils.js';

/**
 * 获取单条记忆详情命令
 */
export function getCommand(program: Command) {
  program
    .command('get <memoryId>')
    .description('获取单条记忆详情')
    .option('-r, --raw', '显示原始 JSON', false)
    .action(async (memoryId, options) => {
      const spinner = createSpinner('获取记忆...');
      spinner.start();

      try {
        const storage = createStorage();

        // 通过 relations 接口获取单条记忆（depth=0）
        const result = await storage.getRelations({
          memoryId,
          depth: 0,
        });

        spinner.succeed();

        if (options.raw) {
          // 原始 JSON 输出
          console.log(JSON.stringify(result.memory, null, 2));
        } else {
          // 格式化输出
          printMemory(result.memory, true);

          // 显示关系
          const relations = result.memory.relations;
          if (relations.replaces?.length || relations.relatedTo?.length || relations.impacts?.length || relations.derivedFrom) {
            console.log(chalk.bold('\n关系:'));
            if (relations.replaces?.length) {
              console.log(`  替代: ${relations.replaces.join(', ')}`);
            }
            if (relations.relatedTo?.length) {
              console.log(`  关联: ${relations.relatedTo.join(', ')}`);
            }
            if (relations.impacts?.length) {
              console.log(`  影响: ${relations.impacts.join(', ')}`);
            }
            if (relations.derivedFrom) {
              console.log(`  基于: ${relations.derivedFrom}`);
            }
          }
        }
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
