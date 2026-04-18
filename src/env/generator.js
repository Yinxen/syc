import fs from 'node:fs';
import path from 'node:path';
import { ENV_DIR } from '../utils/path.js';
import { logger } from '../utils/logger.js';

/** 确保 .env 目录存在 */
function ensureEnvDir() {
  if (!fs.existsSync(ENV_DIR)) {
    fs.mkdirSync(ENV_DIR, { recursive: true });
  }
}

/**
 * 生成单个环境变量的 sh 语法（bash/zsh 通用）
 * 数组值用 : 拼接（适用于 PATH 等）
 */
function toShLine(key, value) {
  if (Array.isArray(value)) {
    return `export ${key}="${value.join(':')}"`;
  }
  return `export ${key}="${value}"`;
}

/**
 * 生成单个环境变量的 fish 语法
 * 数组值用空格分隔
 */
function toFishLine(key, value) {
  if (Array.isArray(value)) {
    return `set -gx ${key} ${value.join(' ')}`;
  }
  return `set -gx ${key} "${value}"`;
}

/** 根据 env.values 生成环境变量文件 */
export function generateEnvFiles(envConfig) {
  if (!envConfig?.values || Object.keys(envConfig.values).length === 0) {
    logger.warn('env.values 为空，跳过环境变量文件生成');
    return;
  }

  ensureEnvDir();

  const shells = envConfig.shells || [];
  const values = envConfig.values;
  const entries = Object.entries(values);

  // bash/zsh 共用 env.sh
  const needSh = shells.some(s => s === 'bash' || s === 'zsh');
  if (needSh) {
    const lines = [
      '#!/usr/bin/env bash',
      '# 由 syc 自动生成，请勿手动编辑',
      '',
      ...entries.map(([k, v]) => toShLine(k, v)),
      '',
    ];
    const shPath = path.join(ENV_DIR, 'env.sh');
    fs.writeFileSync(shPath, lines.join('\n'));
    logger.success(`已生成 ${shPath}`);
  }

  // fish 使用独立语法
  if (shells.includes('fish')) {
    const lines = [
      '# 由 syc 自动生成，请勿手动编辑',
      '',
      ...entries.map(([k, v]) => toFishLine(k, v)),
      '',
    ];
    const fishPath = path.join(ENV_DIR, 'env.fish');
    fs.writeFileSync(fishPath, lines.join('\n'));
    logger.success(`已生成 ${fishPath}`);
  }
}
