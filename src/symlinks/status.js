import fs from 'node:fs';
import path from 'node:path';
import { getPathState, expandHome, validateOriginalPath, validateTargetPath } from '../utils/path.js';
import { logger } from '../utils/logger.js';

export function showStatus(config) {
  if (!config.symlinks || Object.keys(config.symlinks).length === 0) {
    logger.warn('配置中未找到 symlinks 配置');
    return;
  }

  const entries = Object.entries(config.symlinks).sort(([a], [b]) => a.localeCompare(b));

  logger.step(`共 ${entries.length} 项配置映射:\n`);

  for (const [originalPath, targetRelPath] of entries) {
    const aResult = validateOriginalPath(originalPath);
    const bResult = validateTargetPath(targetRelPath);

    if (!aResult.valid || !bResult.valid) {
      logger.error(`  ✗ ${originalPath} -> ${targetRelPath}  (路径配置无效)`);
      continue;
    }

    const aPath = aResult.resolved;
    const bPath = bResult.resolved;
    const aState = getPathState(aPath);
    const bState = getPathState(bPath);

    if (aState === 'l') {
      const target = fs.readlinkSync(aPath);
      const resolvedTarget = path.resolve(path.dirname(aPath), target);
      if (resolvedTarget === bPath && bState !== '?') {
        logger.success(`  ✓ ${originalPath} -> ${targetRelPath}  [已链接]`);
      } else if (bState === '?') {
        logger.warn(`  ! ${originalPath} -> ${targetRelPath}  [链接断裂: B 不存在]`);
      } else {
        logger.warn(`  ! ${originalPath} -> ${targetRelPath}  [链接指向错误: ${target}]`);
      }
    } else if (aState === '?' && bState === '?') {
      logger.info(`  - ${originalPath} -> ${targetRelPath}  [均不存在]`);
    } else if (aState === '?' && bState !== '?') {
      logger.warn(`  ! ${originalPath} -> ${targetRelPath}  [A 不存在, B 存在, 链接缺失]`);
    } else if (aState !== '?' && bState === '?') {
      logger.info(`  ○ ${originalPath} -> ${targetRelPath}  [未链接: A 是实体${aState === 'f' ? '文件' : '目录'}]`);
    } else {
      logger.warn(`  ⚡ ${originalPath} -> ${targetRelPath}  [冲突: A(${aState}) B(${bState}) 均存在]`);
    }
  }
}
