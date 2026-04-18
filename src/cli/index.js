import { Command } from 'commander';
import { mainFlow } from '../main.js';

const program = new Command();

program
  .name('syc')
  .description('dotfile config manager — 管理你的配置文件和环境变量')
  .version('0.0.1')
  .action(async () => {
    await mainFlow();
  });

export default program;
