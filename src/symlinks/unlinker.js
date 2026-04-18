import fs from 'node:fs';
import path from 'node:path';
import * as p from '@clack/prompts';
import { getPathState, getBackupName, validateOriginalPath, validateTargetPath } from '../utils/path.js';
import { logger } from '../utils/logger.js';

/**
 * 对单个映射执行 unlink 操作
 * 将软链接 A 还原为实体文件/目录（从 B 复制回来）
 */
export async function unlinkOne(originalPath, targetRelPath) {
  const aValidation = validateOriginalPath(originalPath);
  if (!aValidation.valid) {
    logger.error(aValidation.reason);
    return;
  }

  const bValidation = validateTargetPath(targetRelPath);
  if (!bValidation.valid) {
    logger.error(bValidation.reason);
    return;
  }

  const aPath = aValidation.resolved;
  const bPath = bValidation.resolved;
  const aState = getPathState(aPath);
  const bState = getPathState(bPath);

  logger.step(`处理: ${originalPath} -> ${targetRelPath}  [A:${aState}, B:${bState}]`);

  // A(?) -> B(?)
  if (aState === '?' && bState === '?') {
    logger.warn(`配置均不存在，跳过: ${originalPath}`);
    return;
  }

  // A(?) -> B(f|d): 复制 B 到 A
  if (aState === '?') {
    ensureParentDir(aPath);
    fs.cpSync(bPath, aPath, { recursive: true });
    logger.success(`已复制 ${bPath} -> ${aPath}`);
    return;
  }

  // A(l) -> B(?): 链接存在但目标缺失
  if (aState === 'l' && bState === '?') {
    logger.warn(`配置文件缺失，链接无效: ${originalPath} -> ${targetRelPath}`);
    return;
  }

  // A(l) -> B(f|d): 删除链接，复制 B 到 A
  if (aState === 'l') {
    fs.unlinkSync(aPath);
    fs.cpSync(bPath, aPath, { recursive: true });
    logger.success(`已还原: 删除软链接并复制 ${bPath} -> ${aPath}`);
    return;
  }

  // A(f|d) -> B(?): 配置缺失，无法还原
  if (bState === '?') {
    logger.warn(`配置缺失，无法还原: ${targetRelPath} 不存在`);
    return;
  }

  // A(f|d) -> B(f|d): 冲突，询问用户
  const strategy = await p.select({
    message: `冲突: ${originalPath} 已是实体文件/目录，${targetRelPath} 也存在，如何处理？`,
    options: [
      { value: 'backup', label: 'backup — 备份 A 后用 B 覆盖' },
      { value: 'overwrite', label: 'overwrite — 直接用 B 覆盖 A' },
      { value: 'skip', label: 'skip — 跳过' },
    ],
  });

  if (p.isCancel(strategy) || strategy === 'skip') {
    logger.info(`已跳过: ${originalPath}`);
    return;
  }

  if (strategy === 'backup') {
    const backupPath = getBackupName(aPath);
    fs.cpSync(aPath, backupPath, { recursive: true });
    logger.info(`已备份: ${aPath} -> ${backupPath}`);

    fs.rmSync(aPath, { recursive: true, force: true });
    fs.cpSync(bPath, aPath, { recursive: true });
    logger.success(`已用 ${bPath} 还原到 ${aPath}`);
  }

  if (strategy === 'overwrite') {
    fs.rmSync(aPath, { recursive: true, force: true });
    fs.cpSync(bPath, aPath, { recursive: true });
    logger.success(`已用 ${bPath} 覆盖 ${aPath}`);
  }
}

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
