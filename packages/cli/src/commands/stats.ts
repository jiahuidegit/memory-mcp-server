import type { Command } from 'commander';
import chalk from 'chalk';
import { createStorage, createSpinner, printError, formatTimestamp, getProjectId } from '../utils.js';

/**
 * 统计命令
 */
export function statsCommand(program: Command) {
  program
    .command('stats')
    .description('显示统计信息')
    .option('-p, --project <id>', '指定项目')
    .action(async (options) => {
      const spinner = createSpinner('统计中...');
      spinner.start();

      try {
        const storage = createStorage();

        // 获取所有记忆
        const result = await storage.recall({
          query: '',
          projectId: options.project,
          limit: 10000,
        });

        spinner.succeed();

        const memories = result.memories;

        if (memories.length === 0) {
          console.log(chalk.yellow('\n暂无记忆数据'));
          return;
        }

        // 统计数据
        const stats = {
          total: memories.length,
          byType: new Map<string, number>(),
          byProject: new Map<string, number>(),
          tags: new Set<string>(),
          sessions: new Set<string>(),
          dateRange: {
            oldest: memories[0].meta.timestamp,
            newest: memories[0].meta.timestamp,
          },
        };

        memories.forEach((m) => {
          // 按类型统计
          stats.byType.set(m.meta.type, (stats.byType.get(m.meta.type) || 0) + 1);

          // 按项目统计
          stats.byProject.set(m.meta.projectId, (stats.byProject.get(m.meta.projectId) || 0) + 1);

          // 标签
          m.meta.tags.forEach((tag) => stats.tags.add(tag));

          // 会话
          if (m.meta.sessionId) {
            stats.sessions.add(m.meta.sessionId);
          }

          // 日期范围
          const ts = m.meta.timestamp;
          if (ts < stats.dateRange.oldest) stats.dateRange.oldest = ts;
          if (ts > stats.dateRange.newest) stats.dateRange.newest = ts;
        });

        // 输出统计
        console.log(chalk.bold('\n📊 统计信息'));
        console.log(chalk.dim('─'.repeat(40)));

        if (options.project) {
          console.log(`项目: ${chalk.cyan(options.project)}`);
        }

        console.log(`\n${chalk.bold('总览:')}`);
        console.log(`  记忆总数: ${chalk.cyan(stats.total)}`);
        console.log(`  项目数: ${chalk.cyan(stats.byProject.size)}`);
        console.log(`  标签数: ${chalk.cyan(stats.tags.size)}`);
        console.log(`  会话数: ${chalk.cyan(stats.sessions.size)}`);

        console.log(`\n${chalk.bold('时间范围:')}`);
        console.log(`  最早: ${formatTimestamp(stats.dateRange.oldest)}`);
        console.log(`  最新: ${formatTimestamp(stats.dateRange.newest)}`);

        console.log(`\n${chalk.bold('按类型分布:')}`);
        const typeNames: Record<string, string> = {
          decision: '决策',
          solution: '解决方案',
          config: '配置',
          code: '代码',
          error: '错误',
          session: '会话',
        };

        // 按数量排序
        const sortedTypes = Array.from(stats.byType.entries()).sort((a, b) => b[1] - a[1]);
        sortedTypes.forEach(([type, count]) => {
          const percentage = ((count / stats.total) * 100).toFixed(1);
          const bar = '█'.repeat(Math.round((count / stats.total) * 20));
          console.log(
            `  ${(typeNames[type] || type).padEnd(8)} ${chalk.cyan(String(count).padStart(4))} ${chalk.dim(`(${percentage}%)`)} ${chalk.blue(bar)}`
          );
        });

        if (!options.project && stats.byProject.size > 1) {
          console.log(`\n${chalk.bold('按项目分布 (Top 5):')}`);
          const sortedProjects = Array.from(stats.byProject.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

          sortedProjects.forEach(([project, count]) => {
            const percentage = ((count / stats.total) * 100).toFixed(1);
            console.log(
              `  ${project.slice(0, 20).padEnd(20)} ${chalk.cyan(String(count).padStart(4))} ${chalk.dim(`(${percentage}%)`)}`
            );
          });
        }

        if (stats.tags.size > 0) {
          console.log(`\n${chalk.bold('常用标签:')}`);
          // 统计标签使用频率
          const tagFreq = new Map<string, number>();
          memories.forEach((m) => {
            m.meta.tags.forEach((tag) => {
              tagFreq.set(tag, (tagFreq.get(tag) || 0) + 1);
            });
          });

          const topTags = Array.from(tagFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

          console.log(
            `  ${topTags.map(([tag, count]) => `${chalk.cyan('#' + tag)}${chalk.dim(`(${count})`)}`).join('  ')}`
          );
        }

        console.log('');
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
