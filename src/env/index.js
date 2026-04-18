import * as p from '@clack/prompts';
import { generateEnvFiles } from './generator.js';
import { inject, uninject } from './injector.js';
import { logger } from '../utils/logger.js';

/** 环境变量管理完整交互流程 */
export async function envFlow(config) {
  if (!config.env) {
    logger.warn('配置中未找到 env 配置，跳过');
    return;
  }

  const action = await p.select({
    message: '环境变量管理',
    options: [
      { value: 'inject', label: 'inject — 注入环境变量' },
      { value: 'uninject', label: 'uninject — 取消注入环境变量' },
    ],
  });

  if (p.isCancel(action)) {
    p.cancel('已取消');
    return;
  }

  if (action === 'inject') {
    await envInjectFlow(config);
  } else {
    await envUninjectFlow(config);
  }
}

/** 注入流程：生成环境变量文件 + 注入 source 片段 */
export async function envInjectFlow(config) {
  const shells = config.env?.shells || [];
  if (shells.length === 0) {
    logger.warn('env.shells 为空，无需注入');
    return;
  }

  logger.step('正在生成环境变量文件...');
  generateEnvFiles(config.env);

  logger.step('正在注入 source 片段到 rc 文件...');
  inject(shells);

  logger.success('环境变量注入完成');
}

/** 取消注入流程 */
async function envUninjectFlow(config) {
  const shells = config.env?.shells || [];
  if (shells.length === 0) {
    logger.warn('env.shells 为空，无需操作');
    return;
  }

  logger.step('正在取消注入 source 片段...');
  uninject(shells);

  logger.success('环境变量取消注入完成');
}
