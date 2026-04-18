import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ENV_DIR } from '../utils/path.js';
import { logger } from '../utils/logger.js';

const MARKER_START = '# >>> syc env >>>';
const MARKER_END = '# <<< syc env <<<';

/** 获取 shell 对应的 rc 文件路径 */
function getRcPath(shell) {
  switch (shell) {
    case 'bash': return path.join(os.homedir(), '.bashrc');
    case 'zsh': return path.join(os.homedir(), '.zshrc');
    case 'fish': return path.join(os.homedir(), '.config', 'fish', 'config.fish');
    default: return null;
  }
}

/** 获取 shell 对应的 source 语句 */
function getSourceLine(shell) {
  if (shell === 'fish') {
    return `source ${path.join(ENV_DIR, 'env.fish')}`;
  }
  return `source ${path.join(ENV_DIR, 'env.sh')}`;
}

/**
 * 注入环境变量 source 片段到 rc 文件
 * - 如果标记块不存在：追加标记块
 * - 如果标记块存在但 source 被注释：取消注释
 * - 如果标记块存在且 source 未注释：无需操作
 */
export function inject(shells) {
  for (const shell of shells) {
    const rcPath = getRcPath(shell);
    if (!rcPath) {
      logger.warn(`未知 shell 类型: ${shell}，跳过`);
      continue;
    }

    const sourceLine = getSourceLine(shell);

    // rc 文件不存在则创建
    if (!fs.existsSync(rcPath)) {
      fs.mkdirSync(path.dirname(rcPath), { recursive: true });
      fs.writeFileSync(rcPath, '');
      logger.info(`已创建 ${rcPath}`);
    }

    const content = fs.readFileSync(rcPath, 'utf-8');
    const startIdx = content.indexOf(MARKER_START);
    const endIdx = content.indexOf(MARKER_END);

    if (startIdx === -1 || endIdx === -1) {
      // 标记块不存在，追加
      const block = `\n${MARKER_START}\n${sourceLine}\n${MARKER_END}\n`;
      fs.writeFileSync(rcPath, content + block);
      logger.success(`[${shell}] 已注入 source 片段到 ${rcPath}`);
    } else {
      // 标记块存在，检查是否被注释
      const blockContent = content.substring(startIdx, endIdx + MARKER_END.length);
      const commentedLine = `# ${sourceLine}`;

      if (blockContent.includes(commentedLine)) {
        // 取消注释
        const newContent = content.replace(commentedLine, sourceLine);
        fs.writeFileSync(rcPath, newContent);
        logger.success(`[${shell}] 已取消注释 source 片段 ${rcPath}`);
      } else if (blockContent.includes(sourceLine)) {
        logger.info(`[${shell}] source 片段已存在且生效，无需操作 ${rcPath}`);
      } else {
        // 标记块存在但内容不匹配，替换整个块
        const newBlock = `${MARKER_START}\n${sourceLine}\n${MARKER_END}`;
        const newContent = content.substring(0, startIdx) + newBlock + content.substring(endIdx + MARKER_END.length);
        fs.writeFileSync(rcPath, newContent);
        logger.success(`[${shell}] 已更新 source 片段 ${rcPath}`);
      }
    }
  }
}

/**
 * 取消注入：注释 source 片段
 * 将标记块内的 source 行注释掉
 */
export function uninject(shells) {
  for (const shell of shells) {
    const rcPath = getRcPath(shell);
    if (!rcPath) {
      logger.warn(`未知 shell 类型: ${shell}，跳过`);
      continue;
    }

    if (!fs.existsSync(rcPath)) {
      logger.info(`[${shell}] rc 文件不存在，无需操作: ${rcPath}`);
      continue;
    }

    const content = fs.readFileSync(rcPath, 'utf-8');
    const startIdx = content.indexOf(MARKER_START);
    const endIdx = content.indexOf(MARKER_END);

    if (startIdx === -1 || endIdx === -1) {
      logger.info(`[${shell}] 未找到 syc 标记块，无需操作: ${rcPath}`);
      continue;
    }

    const sourceLine = getSourceLine(shell);
    const commentedLine = `# ${sourceLine}`;

    if (content.includes(commentedLine)) {
      logger.info(`[${shell}] source 片段已被注释，无需操作: ${rcPath}`);
      continue;
    }

    if (content.includes(sourceLine)) {
      const newContent = content.replace(sourceLine, commentedLine);
      fs.writeFileSync(rcPath, newContent);
      logger.success(`[${shell}] 已注释 source 片段: ${rcPath}`);
    } else {
      logger.info(`[${shell}] 未找到 source 片段，无需操作: ${rcPath}`);
    }
  }
}
