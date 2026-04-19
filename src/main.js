import * as p from '@clack/prompts';
import fs from 'node:fs';
import path from 'node:path';
import { SYC_DIR } from './utils/path.js';
import { CONFIG_TEMPLATE } from './config/template.js';
import { loadConfig } from './config/loader.js';
import { envFlow, envInjectFlow } from './env/index.js';
import { symlinksFlow, symlinksLinkFlow, showStatus } from './symlinks/index.js';
import { logger } from './utils/logger.js';

const CONFIG_PATH = path.join(SYC_DIR, 'config.js');

function initConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    logger.info(`配置文件已存在，无需重复初始化: ${CONFIG_PATH}`);
    return;
  }

  if (!fs.existsSync(SYC_DIR)) {
    fs.mkdirSync(SYC_DIR, { recursive: true });
    logger.info(`已创建目录: ${SYC_DIR}`);
  }

  fs.writeFileSync(CONFIG_PATH, CONFIG_TEMPLATE);
  logger.success(`已创建配置文件: ${CONFIG_PATH}`);
  logger.info('请编辑配置文件后重新运行 syc 开始管理');
}

/** 主交互流程（无子命令时进入） */
export async function mainFlow() {
  p.intro('syc — dotfile config manager');

  const action = await p.select({
    message: '请选择操作',
    options: [
      { value: 'init', label: 'init — 初始化配置文件' },
      { value: 'status', label: 'status — 查看配置文件链接状态' },
      { value: 'env', label: 'env — 环境变量管理' },
      { value: 'symlinks', label: 'symlinks — 配置文件链接管理' },
      { value: 'all', label: 'all — 执行全部操作（注入环境变量 + 链接化配置）' },
      { value: 'cancel', label: 'cancel — 取消' },
    ],
  });

  if (p.isCancel(action) || action === 'cancel') {
    p.cancel('已取消');
    return;
  }

  if (action === 'init') {
    initConfig();
    p.outro('完成');
    return;
  }

  const config = await loadConfig();

  switch (action) {
    case 'status':
      showStatus(config);
      break;
    case 'env':
      await envFlow(config);
      break;
    case 'symlinks':
      await symlinksFlow(config);
      break;
    case 'all':
      await envInjectFlow(config);
      await symlinksLinkFlow(config);
      break;
  }

  p.outro('完成');
}
