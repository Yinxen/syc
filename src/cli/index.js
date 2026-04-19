import { Command } from 'commander';
import { mainFlow } from '../main.js';
import { loadConfig } from '../config/loader.js';
import { envInjectFlow } from '../env/index.js';
import { uninject } from '../env/injector.js';
import { generateEnvFiles } from '../env/generator.js';
import { symlinksLinkFlow } from '../symlinks/index.js';
import { showStatus } from '../symlinks/status.js';
import { logger } from '../utils/logger.js';
import * as p from '@clack/prompts';
import fs from 'node:fs';
import path from 'node:path';
import { SYC_DIR } from '../utils/path.js';
import { CONFIG_TEMPLATE } from '../config/template.js';

const CONFIG_PATH = path.join(SYC_DIR, 'config.js');

const program = new Command();

program
  .name('syc')
  .description('dotfile config manager — 管理你的配置文件和环境变量')
  .version('0.1.0')
  .action(async () => {
    await mainFlow();
  });

program
  .command('init')
  .description('初始化配置文件 ~/.syc/config.js')
  .action(() => {
    p.intro('syc init');
    if (fs.existsSync(CONFIG_PATH)) {
      logger.info(`配置文件已存在: ${CONFIG_PATH}`);
    } else {
      if (!fs.existsSync(SYC_DIR)) {
        fs.mkdirSync(SYC_DIR, { recursive: true });
      }
      fs.writeFileSync(CONFIG_PATH, CONFIG_TEMPLATE);
      logger.success(`已创建配置文件: ${CONFIG_PATH}`);
      logger.info('请编辑配置文件后重新运行 syc 开始管理');
    }
    p.outro('完成');
  });

program
  .command('status')
  .description('查看配置文件链接状态')
  .action(async () => {
    p.intro('syc status');
    const config = await loadConfig();
    showStatus(config);
    p.outro('');
  });

program
  .command('env')
  .description('注入环境变量到 shell rc 文件')
  .option('--uninject', '取消注入环境变量')
  .action(async (opts) => {
    p.intro('syc env');
    const config = await loadConfig();
    if (!config.env) {
      logger.warn('配置中未找到 env 配置');
      p.outro('');
      return;
    }
    const shells = config.env?.shells || [];
    if (shells.length === 0) {
      logger.warn('env.shells 为空');
      p.outro('');
      return;
    }
    if (opts.uninject) {
      uninject(shells);
      logger.success('环境变量取消注入完成');
    } else {
      await envInjectFlow(config);
    }
    p.outro('完成');
  });

program
  .command('link')
  .description('将配置文件链接化')
  .action(async () => {
    p.intro('syc link');
    const config = await loadConfig();
    await symlinksLinkFlow(config);
    p.outro('完成');
  });

program
  .command('apply')
  .description('执行全部操作（注入环境变量 + 链接化配置）')
  .action(async () => {
    p.intro('syc apply');
    const config = await loadConfig();
    await envInjectFlow(config);
    await symlinksLinkFlow(config);
    p.outro('完成');
  });

export default program;
