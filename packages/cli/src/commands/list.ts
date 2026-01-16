import type { Command } from 'commander';
import chalk from 'chalk';
import { createStorage, createSpinner, printError, printTable, formatType, formatTimestamp } from '../utils.js';
import { MemoryType } from '@emp/core';

/**
 * 列表命令
 */
export function listCommand(program: Command) {
  const list = program.command('list').description('列出记忆或项目');

  // 列出所有项目
  list
    .command('projects')
    .description('列出所有项目')
    .action(async () => {
      const spinner = createSpinner('加载项目列表...');
      spinner.start();

      try {
        const storage = createStorage();

        // 查询所有记忆，按项目分组统计
        const result = await storage.recall({ query: '', limit: 10000 });
        spinner.succeed();

        // 按项目统计
        const projectStats = new Map<string, { count: number; lastUpdate: string; types: Set<string> }>();

        result.memories.forEach((m) => {
          const projectId = m.meta.projectId;
          const existing = projectStats.get(projectId);

          if (existing) {
            existing.count++;
            if (new Date(m.meta.timestamp) > new Date(existing.lastUpdate)) {
              existing.lastUpdate = m.meta.timestamp;
            }
            existing.types.add(m.meta.type);
          } else {
            projectStats.set(projectId, {
              count: 1,
              lastUpdate: m.meta.timestamp,
              types: new Set([m.meta.type]),
            });
          }
        });

        if (projectStats.size === 0) {
          console.log(chalk.yellow('\n暂无项目'));
          return;
        }

        console.log(chalk.bold(`\n共 ${projectStats.size} 个项目:\n`));

        // 转换为表格数据
        const headers = ['项目 ID', '记忆数', '类型', '最后更新'];
        const rows: string[][] = [];

        projectStats.forEach((stats, projectId) => {
          rows.push([
            projectId,
            String(stats.count),
            Array.from(stats.types).join(', '),
            formatTimestamp(stats.lastUpdate),
          ]);
        });

        // 按记忆数排序
        rows.sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
        printTable(headers, rows);
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // 列出记忆
  list
    .command('memories')
    .description('列出记忆')
    .option('-p, --project <id>', '按项目过滤')
    .option('-t, --type <type>', '按类型过滤')
    .option('-l, --limit <number>', '返回数量', '20')
    .option('--all', '显示所有（不分页）', false)
    .action(async (options) => {
      const spinner = createSpinner('加载记忆列表...');
      spinner.start();

      try {
        const storage = createStorage();
        const limit = options.all ? 10000 : parseInt(options.limit);

        const result = await storage.recall({
          query: '',
          projectId: options.project,
          type: options.type as MemoryType | undefined,
          limit,
        });

        spinner.succeed();

        if (result.memories.length === 0) {
          console.log(chalk.yellow('\n暂无记忆'));
          return;
        }

        console.log(chalk.bold(`\n共 ${result.total} 条记忆${result.total > limit ? `（显示前 ${limit} 条）` : ''}:\n`));

        // 表格显示
        const headers = ['ID', '类型', '项目', '摘要', '时间'];
        const rows: string[][] = result.memories.map((m) => [
          m.meta.id.slice(0, 8) + '...',
          m.meta.type,
          m.meta.projectId.slice(0, 15) + (m.meta.projectId.length > 15 ? '...' : ''),
          m.content.summary.slice(0, 30) + (m.content.summary.length > 30 ? '...' : ''),
          formatTimestamp(m.meta.timestamp),
        ]);

        printTable(headers, rows);
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // 列出标签
  list
    .command('tags')
    .description('列出所有标签')
    .option('-p, --project <id>', '按项目过滤')
    .action(async (options) => {
      const spinner = createSpinner('加载标签列表...');
      spinner.start();

      try {
        const storage = createStorage();

        const result = await storage.recall({
          query: '',
          projectId: options.project,
          limit: 10000,
        });

        spinner.succeed();

        // 统计标签
        const tagStats = new Map<string, number>();
        result.memories.forEach((m) => {
          m.meta.tags.forEach((tag) => {
            tagStats.set(tag, (tagStats.get(tag) || 0) + 1);
          });
        });

        if (tagStats.size === 0) {
          console.log(chalk.yellow('\n暂无标签'));
          return;
        }

        console.log(chalk.bold(`\n共 ${tagStats.size} 个标签:\n`));

        // 按使用次数排序
        const sortedTags = Array.from(tagStats.entries()).sort((a, b) => b[1] - a[1]);

        sortedTags.forEach(([tag, count]) => {
          console.log(`  ${chalk.cyan('#' + tag)} ${chalk.dim(`(${count})`)}`);
        });
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
