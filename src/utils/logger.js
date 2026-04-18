import * as p from '@clack/prompts';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const LOG_DIR = path.join(os.homedir(), '.syc', '.logs');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function getLogFile() {
  const d = new Date();
  const name = `syc-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.log`;
  return path.join(LOG_DIR, name);
}

function writeLog(level, message) {
  try {
    ensureLogDir();
    const line = `[${new Date().toISOString()}] [${level}] ${message}\n`;
    fs.appendFileSync(getLogFile(), line);
  } catch {
    // 日志写入失败不应中断主流程
  }
}

export const logger = {
  info(msg) { p.log.info(msg); writeLog('INFO', msg); },
  warn(msg) { p.log.warn(msg); writeLog('WARN', msg); },
  error(msg) { p.log.error(msg); writeLog('ERROR', msg); },
  success(msg) { p.log.success(msg); writeLog('SUCCESS', msg); },
  step(msg) { p.log.step(msg); writeLog('STEP', msg); },
};
