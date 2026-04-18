import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SYC_DIR } from '../utils/path.js';
import { logger } from '../utils/logger.js';
import { validateOriginalPath, validateTargetPath } from '../utils/path.js';

const CONFIG_PATH = path.join(SYC_DIR, 'config.js');

/** 加载并验证 ~/.syc/config.js */
export async function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    logger.error(`配置文件不存在: ${CONFIG_PATH}`);
    logger.info('请先运行 syc init 初始化配置');
    process.exit(1);
  }

  const configUrl = pathToFileURL(CONFIG_PATH).href;
  // 添加时间戳避免模块缓存
  const module = await import(`${configUrl}?t=${Date.now()}`);
  const config = module.default;

  if (!config) {
    logger.error('配置文件必须使用 export default 导出配置对象');
    process.exit(1);
  }

  validateConfig(config);
  return config;
}

/** 验证配置合法性 */
function validateConfig(config) {
  // 验证 symlinks 中的路径
  if (config.symlinks) {
    for (const [a, b] of Object.entries(config.symlinks)) {
      const aResult = validateOriginalPath(a);
      if (!aResult.valid) {
        logger.error(`symlinks 配置错误 — ${aResult.reason}`);
        process.exit(1);
      }
      const bResult = validateTargetPath(b);
      if (!bResult.valid) {
        logger.error(`symlinks 配置错误 — ${bResult.reason}`);
        process.exit(1);
      }
    }
  }

  // 验证 env 配置
  if (config.env) {
    if (config.env.shells && !Array.isArray(config.env.shells)) {
      logger.error('env.shells 必须是数组');
      process.exit(1);
    }
    const validShells = ['bash', 'zsh', 'fish'];
    for (const shell of config.env?.shells || []) {
      if (!validShells.includes(shell)) {
        logger.error(`不支持的 shell 类型: ${shell}，支持: ${validShells.join(', ')}`);
        process.exit(1);
      }
    }
  }
}
