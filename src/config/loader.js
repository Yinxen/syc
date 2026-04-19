import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SYC_DIR, validateOriginalPath, validateTargetPath } from '../utils/path.js';
import { logger } from '../utils/logger.js';
import { configSchema } from './schema.js';

const CONFIG_PATH = path.join(SYC_DIR, 'config.js');

export async function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    logger.error(`配置文件不存在: ${CONFIG_PATH}`);
    logger.info('请先运行 syc init 初始化配置');
    process.exit(1);
  }

  const configUrl = pathToFileURL(CONFIG_PATH).href;

  let module;
  try {
    module = await import(`${configUrl}?t=${Date.now()}`);
  } catch (err) {
    logger.error(`配置文件加载失败: ${CONFIG_PATH}`);
    logger.error(`原因: ${err.message}`);
    process.exit(1);
  }

  const raw = module.default;

  if (!raw) {
    logger.error('配置文件必须使用 export default 导出配置对象');
    process.exit(1);
  }

  const result = configSchema.safeParse(raw);

  if (!result.success) {
    logger.error('配置文件格式错误:');
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(根对象)';
      logger.error(`  ${path}: ${issue.message}`);
    }
    process.exit(1);
  }

  const config = result.data;

  validatePaths(config);
  return config;
}

function validatePaths(config) {
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
}
