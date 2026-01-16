import type { Command } from 'commander';
import chalk from 'chalk';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { loadConfig, type CLIConfig } from '../config.js';
import { printSuccess, printError } from '../utils.js';

// 配置文件路径
const CONFIG_PATH = join(homedir(), '.cmsrc.json');

/**
 * 配置管理命令
 */
export function configCommand(program: Command) {
  const config = program.command('config').description('配置管理');

  // 初始化配置
  config
    .command('init')
    .description('初始化配置文件')
    .option('-f, --force', '强制覆盖已存在的配置', false)
    .action((options) => {
      try {
        if (existsSync(CONFIG_PATH) && !options.force) {
          console.log(chalk.yellow('配置文件已存在，使用 --force 强制覆盖'));
          return;
        }

        const defaultConfig: CLIConfig = {
          dbPath: join(homedir(), '.cms', 'memory.db'),
          enableCache: true,
          cacheSize: 100,
        };

        // 确保目录存在
        const configDir = dirname(CONFIG_PATH);
        if (!existsSync(configDir)) {
          mkdirSync(configDir, { recursive: true });
        }

        writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
        printSuccess(`配置文件已创建: ${CONFIG_PATH}`);
        console.log(chalk.dim('\n默认配置:'));
        console.log(JSON.stringify(defaultConfig, null, 2));
      } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // 显示当前配置
  config
    .command('show')
    .description('显示当前配置')
    .action(() => {
      try {
        const current = loadConfig();
        console.log(chalk.bold('\n当前配置:'));
        console.log(JSON.stringify(current, null, 2));

        if (existsSync(CONFIG_PATH)) {
          console.log(chalk.dim(`\n配置文件: ${CONFIG_PATH}`));
        } else {
          console.log(chalk.dim('\n(使用默认配置)'));
        }
      } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // 设置配置项
  config
    .command('set <key> <value>')
    .description('设置配置项')
    .action((key, value) => {
      try {
        const current = loadConfig();

        // 类型转换
        let parsedValue: string | number | boolean = value;
        if (value === 'true') parsedValue = true;
        else if (value === 'false') parsedValue = false;
        else if (!isNaN(Number(value))) parsedValue = Number(value);

        // 验证 key
        const validKeys = ['dbPath', 'defaultProject', 'enableCache', 'cacheSize'];
        if (!validKeys.includes(key)) {
          throw new Error(`无效的配置项: ${key}\n有效项: ${validKeys.join(', ')}`);
        }

        // 更新配置
        (current as unknown as Record<string, unknown>)[key] = parsedValue;

        // 确保目录存在
        const configDir = dirname(CONFIG_PATH);
        if (!existsSync(configDir)) {
          mkdirSync(configDir, { recursive: true });
        }

        writeFileSync(CONFIG_PATH, JSON.stringify(current, null, 2));
        printSuccess(`已设置 ${key} = ${parsedValue}`);
      } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // 获取配置项
  config
    .command('get <key>')
    .description('获取配置项')
    .action((key) => {
      try {
        const current = loadConfig();
        const value = (current as unknown as Record<string, unknown>)[key];

        if (value === undefined) {
          console.log(chalk.yellow(`配置项 ${key} 未设置`));
        } else {
          console.log(`${key} = ${chalk.cyan(String(value))}`);
        }
      } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // 设置默认项目
  config
    .command('project <projectId>')
    .description('设置默认项目')
    .action((projectId) => {
      try {
        const current = loadConfig();
        current.defaultProject = projectId;

        // 确保目录存在
        const configDir = dirname(CONFIG_PATH);
        if (!existsSync(configDir)) {
          mkdirSync(configDir, { recursive: true });
        }

        writeFileSync(CONFIG_PATH, JSON.stringify(current, null, 2));
        printSuccess(`默认项目已设置为: ${projectId}`);
      } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}
