import * as p from '@clack/prompts';
import { linkOne } from './linker.js';
import { unlinkOne } from './unlinker.js';
import { logger } from '../utils/logger.js';

/** 配置文件链接管理完整交互流程 */
export async function symlinksFlow(config) {
  if (!config.symlinks || Object.keys(config.symlinks).length === 0) {
    logger.warn('配置中未找到 symlinks 配置，跳过');
    return;
  }

  const action = await p.select({
    message: '配置文件链接管理',
    options: [
      { value: 'link', label: 'link — 将配置文件链接化' },
      { value: 'unlink', label: 'unlink — 还原配置文件' },
    ],
  });

  if (p.isCancel(action)) {
    p.cancel('已取消');
    return;
  }

  if (action === 'link') {
    await symlinksLinkFlow(config);
  } else {
    await symlinksUnlinkFlow(config);
  }
}

/** link 子流程：选择目标并逐个链接化 */
export async function symlinksLinkFlow(config) {
  const entries = Object.entries(config.symlinks);
  const sorted = entries.sort(([a], [b]) => a.localeCompare(b));

  const selected = await selectConfigs(sorted, '选择需要链接化的配置 (A -> B)');
  if (!selected) return;

  for (const originalPath of selected) {
    const targetRelPath = config.symlinks[originalPath];
    await linkOne(originalPath, targetRelPath);
  }

  logger.success('链接化操作完成');
}

/** unlink 子流程：选择目标并逐个还原 */
async function symlinksUnlinkFlow(config) {
  const entries = Object.entries(config.symlinks);
  const sorted = entries.sort(([a], [b]) => a.localeCompare(b));

  const selected = await selectConfigs(sorted, '选择需要还原的配置 (取消链接)');
  if (!selected) return;

  for (const originalPath of selected) {
    const targetRelPath = config.symlinks[originalPath];
    await unlinkOne(originalPath, targetRelPath);
  }

  logger.success('还原操作完成');
}

/**
 * 通用配置选择：先选 all/手动选择，再根据需要展示 multiselect
 * 返回选中的 originalPath 数组，取消时返回 null
 */
async function selectConfigs(sortedEntries, message) {
  const mode = await p.select({
    message,
    options: [
      { value: 'all', label: `all — 全选所有配置 (共 ${sortedEntries.length} 项)` },
      { value: 'manual', label: 'manual — 手动选择' },
    ],
  });

  if (p.isCancel(mode)) {
    p.cancel('已取消');
    return null;
  }

  if (mode === 'all') {
    return sortedEntries.map(([a]) => a);
  }

  const selected = await p.multiselect({
    message: '选择配置项 (空格选中，回车确认)',
    options: sortedEntries.map(([a, b]) => ({
      value: a,
      label: `${a} -> ${b}`,
    })),
  });

  if (p.isCancel(selected)) {
    p.cancel('已取消');
    return null;
  }

  return selected;
}
