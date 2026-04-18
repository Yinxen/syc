import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

export const SYC_DIR = path.join(os.homedir(), '.syc');
export const ENV_DIR = path.join(SYC_DIR, '.env');

/** 展开 ~ 为用户主目录 */
export function expandHome(p) {
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

/**
 * 验证 A 路径（原始配置路径）
 * - 必须是绝对路径（支持 ~ 开头）
 * - 不能是 ~/.syc/ 本身或其子路径
 */
export function validateOriginalPath(originalPath) {
  const expanded = expandHome(originalPath);
  const resolved = path.resolve(expanded);

  if (!path.isAbsolute(resolved)) {
    return { valid: false, reason: `路径必须是绝对路径: ${originalPath}` };
  }

  const sycResolved = path.resolve(SYC_DIR);
  if (resolved === sycResolved || resolved.startsWith(sycResolved + path.sep)) {
    return { valid: false, reason: `路径不能指向 ~/.syc/ 目录本身或其子路径: ${originalPath}` };
  }

  return { valid: true, resolved };
}

/**
 * 验证 B 路径（目标路径，相对于 ~/.syc/）
 * - 必须是相对路径
 * - 解析后不能逃逸到 ~/.syc/ 外部（禁止 ../）
 */
export function validateTargetPath(targetPath) {
  if (path.isAbsolute(targetPath)) {
    return { valid: false, reason: `目标路径必须是相对路径: ${targetPath}` };
  }

  const resolved = path.resolve(SYC_DIR, targetPath);
  const sycResolved = path.resolve(SYC_DIR);

  if (!resolved.startsWith(sycResolved + path.sep)) {
    return { valid: false, reason: `目标路径不能逃逸到 ~/.syc/ 外部: ${targetPath}` };
  }

  return { valid: true, resolved };
}

/** 检测路径状态: ? (不存在), l (链接), f (文件), d (目录) */
export function getPathState(filePath) {
  try {
    const lstat = fs.lstatSync(filePath);
    if (lstat.isSymbolicLink()) return 'l';
    if (lstat.isFile()) return 'f';
    if (lstat.isDirectory()) return 'd';
    return '?';
  } catch {
    return '?';
  }
}

/** 生成备份文件名: {filepath}-{YYMMDD_HHmmss}.dc.backup */
export function getBackupName(filePath) {
  const now = new Date();
  const ts = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  return `${filePath}-${ts}.dc.backup`;
}
