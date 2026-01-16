#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { storeCommand } from './commands/store.js';
import { recallCommand } from './commands/recall.js';
import { decisionCommand } from './commands/decision.js';
import { solutionCommand } from './commands/solution.js';
import { sessionCommand } from './commands/session.js';
import { timelineCommand } from './commands/timeline.js';
import { relationsCommand } from './commands/relations.js';
import { configCommand } from './commands/config.js';
import { listCommand } from './commands/list.js';
import { getCommand } from './commands/get.js';
import { deleteCommand } from './commands/delete.js';
import { exportCommand } from './commands/export.js';
import { statsCommand } from './commands/stats.js';

const program = new Command();

program
  .name('cms')
  .description('Context Memory System - AI 记忆管理工具')
  .version('0.1.0');

// 存储类命令
storeCommand(program);
decisionCommand(program);
solutionCommand(program);
sessionCommand(program);

// 查询类命令
recallCommand(program);
getCommand(program);
listCommand(program);
timelineCommand(program);
relationsCommand(program);

// 管理类命令
deleteCommand(program);
exportCommand(program);
statsCommand(program);
configCommand(program);

// 错误处理
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error) {
  if (error instanceof Error) {
    console.error(chalk.red('❌ 错误:'), error.message);
  }
  process.exit(1);
}
