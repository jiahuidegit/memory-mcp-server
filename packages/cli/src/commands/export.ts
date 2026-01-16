import type { Command } from 'commander';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { createStorage, createSpinner, printSuccess, printError, formatTimestamp } from '../utils.js';
import { MemoryType, Memory } from '@emp/core';

/**
 * 导出命令
 */
export function exportCommand(program: Command) {
  program
    .command('export')
    .description('导出记忆')
    .requiredOption('-o, --output <file>', '输出文件路径')
    .option('-p, --project <id>', '按项目过滤')
    .option('-t, --type <type>', '按类型过滤')
    .option('-f, --format <format>', '导出格式 (json/md)', 'json')
    .option('-l, --limit <number>', '导出数量', '1000')
    .action(async (options) => {
      const spinner = createSpinner('导出记忆中...');
      spinner.start();

      try {
        const storage = createStorage();
        const limit = parseInt(options.limit);

        const result = await storage.recall({
          query: '',
          projectId: options.project,
          type: options.type as MemoryType | undefined,
          limit,
        });

        if (result.memories.length === 0) {
          spinner.fail();
          console.log(chalk.yellow('没有可导出的记忆'));
          return;
        }

        let content: string;
        let outputPath = options.output;

        if (options.format === 'md' || options.format === 'markdown') {
          // Markdown 格式
          if (!outputPath.endsWith('.md')) {
            outputPath += '.md';
          }
          content = exportToMarkdown(result.memories, options.project);
        } else {
          // JSON 格式
          if (!outputPath.endsWith('.json')) {
            outputPath += '.json';
          }
          content = JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              projectId: options.project || 'all',
              type: options.type || 'all',
              total: result.memories.length,
              memories: result.memories,
            },
            null,
            2
          );
        }

        writeFileSync(outputPath, content, 'utf-8');

        spinner.succeed();
        printSuccess(`已导出 ${result.memories.length} 条记忆到: ${outputPath}`);
      } catch (error) {
        spinner.fail();
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

/**
 * 导出为 Markdown 格式
 */
function exportToMarkdown(memories: Memory[], projectId?: string): string {
  const lines: string[] = [];

  // 标题
  lines.push(`# Context Memory Export`);
  lines.push('');
  lines.push(`> 导出时间: ${new Date().toLocaleString('zh-CN')}`);
  if (projectId) {
    lines.push(`> 项目: ${projectId}`);
  }
  lines.push(`> 总计: ${memories.length} 条记忆`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // 按类型分组
  const grouped = new Map<string, Memory[]>();
  memories.forEach((m) => {
    const type = m.meta.type;
    if (!grouped.has(type)) {
      grouped.set(type, []);
    }
    grouped.get(type)!.push(m);
  });

  // 类型中文映射
  const typeNames: Record<string, string> = {
    decision: '架构决策',
    solution: '解决方案',
    config: '配置',
    code: '代码',
    error: '错误',
    session: '会话',
  };

  // 按类型输出
  grouped.forEach((typeMemories, type) => {
    lines.push(`## ${typeNames[type] || type} (${typeMemories.length})`);
    lines.push('');

    typeMemories.forEach((m, idx) => {
      lines.push(`### ${idx + 1}. ${m.content.summary}`);
      lines.push('');
      lines.push(`- **ID**: \`${m.meta.id}\``);
      lines.push(`- **项目**: ${m.meta.projectId}`);
      lines.push(`- **时间**: ${formatTimestamp(m.meta.timestamp)}`);
      if (m.meta.tags.length > 0) {
        lines.push(`- **标签**: ${m.meta.tags.map((t) => `\`${t}\``).join(', ')}`);
      }
      lines.push('');

      // 详细数据
      const data = m.content.data as Record<string, unknown>;
      if (Object.keys(data).length > 0) {
        lines.push('**详细内容:**');
        lines.push('');
        lines.push('```json');
        lines.push(JSON.stringify(data, null, 2));
        lines.push('```');
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    });
  });

  return lines.join('\n');
}
