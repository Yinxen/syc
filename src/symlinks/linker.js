import fs from 'node:fs';
import path from 'node:path';
import * as p from '@clack/prompts';
import { getPathState, getBackupName, expandHome, validateOriginalPath, validateTargetPath, ensureParentDir, SYC_DIR } from '../utils/path.js';
import { logger } from '../utils/logger.js';

/**
 * 对单个映射执行 link 操作
 * A(原始路径) -> B(~/.syc/ 下的托管路径)
 * 目标：让 A 成为指向 B 的软链接
 */
export async function linkOne(originalPath, targetRelPath) {
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

  // A(?) -> B(f|d): 重建软链接
  if (aState === '?') {
    ensureParentDir(aPath);
    fs.symlinkSync(bPath, aPath);
    logger.success(`已重建软链接: ${aPath} -> ${bPath}`);
    return;
  }

  // A(l) -> B(?): 链接存在但目标缺失
  if (aState === 'l' && bState === '?') {
    logger.warn(`配置文件缺失，链接无效: ${originalPath} -> ${targetRelPath}`);
    return;
  }

  // A(l) -> B(f|d): 检查链接指向是否正确
  if (aState === 'l') {
    const currentTarget = fs.readlinkSync(aPath);
    const resolvedTarget = path.resolve(path.dirname(aPath), currentTarget);
    if (resolvedTarget === bPath) {
      logger.info(`软链接指向正确，无需操作: ${aPath}`);
    } else {
      // 自动修正软链接指向
      fs.unlinkSync(aPath);
      fs.symlinkSync(bPath, aPath);
      logger.success(`已修正软链接指向: ${aPath} -> ${bPath}`);
    }
    return;
  }

  // A(f|d) -> B(?): 将 A 移动到 B，创建软链接
  if (bState === '?') {
    ensureParentDir(bPath);
    moveSync(aPath, bPath);
    fs.symlinkSync(bPath, aPath);
    logger.success(`已将 ${aPath} 移动到 ${bPath} 并创建软链接`);
    return;
  }

  // A(f|d) -> B(f|d): 冲突，询问用户
  const strategy = await p.select({
    message: `冲突: ${originalPath} 和 ${targetRelPath} 均已存在，如何处理？`,
    options: [
      { value: 'backup', label: 'backup — 备份 A 后将 A 移入 B 并创建链接' },
      { value: 'overwrite', label: 'overwrite — 删除 A 并直接链接到现有 B' },
      { value: 'skip', label: 'skip — 跳过' },
    ],
  });

  if (p.isCancel(strategy) || strategy === 'skip') {
    logger.info(`已跳过: ${originalPath}`);
    return;
  }

  if (strategy === 'backup') {
    // 备份 A，将 A 移动到 B（覆盖），创建软链接
    const backupPath = getBackupName(aPath);
    fs.cpSync(aPath, backupPath, { recursive: true });
    logger.info(`已备份: ${aPath} -> ${backupPath}`);

    fs.rmSync(bPath, { recursive: true, force: true });
    moveSync(aPath, bPath);
    fs.symlinkSync(bPath, aPath);
    logger.success(`已将 ${aPath} 移入 ${bPath} 并创建软链接`);
  }

  if (strategy === 'overwrite') {
    // 删除 A，创建软链接到现有 B
    fs.rmSync(aPath, { recursive: true, force: true });
    fs.symlinkSync(bPath, aPath);
    logger.success(`已删除 ${aPath} 并创建软链接到 ${bPath}`);
  }
}

/** 跨文件系统安全的移动操作，renameSync 遇到 EXDEV 时回退到 copy+rm */
function moveSync(src, dest) {
  try {
    fs.renameSync(src, dest);
  } catch (err) {
    if (err.code === 'EXDEV') {
      fs.cpSync(src, dest, { recursive: true });
      fs.rmSync(src, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
}
