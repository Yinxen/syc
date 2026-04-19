# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**syc** is a Linux dotfile configuration manager that centralizes config files under `~/.syc/` via symlinks and manages environment variables declaratively. It uses an interactive CLI built with Commander + @clack/prompts.

User configuration lives at `~/.syc/config.js` (ES module with `export default`).

## Commands

- `pnpm install` — install dependencies
- `node index.js` — run the CLI (interactive prompts)

No test framework or linter is configured.

## Architecture

Entry: `index.js` → `src/cli/index.js` (Commander program) → `src/main.js` (interactive menu via clack/prompts).

Two core subsystems:

**Environment variables** (`src/env/`):
- `generator.js` — reads `config.env.values`, writes `~/.syc/.env/env.sh` (bash/zsh) and `env.fish` (fish)
- `injector.js` — manages a `# >>> syc env >>>` / `# <<< syc env <<<` marker block in shell rc files, toggling source lines via comment/uncomment

**Symlinks** (`src/symlinks/`):
- `linker.js` — makes A (original path) a symlink pointing to B (`~/.syc/`-relative path). Handles 9 state combinations (A/B × ?/l/f/d) with conflict resolution (backup/overwrite/skip)
- `unlinker.js` — reverses link: copies B back to A as a real file/directory, same conflict resolution

**Shared utilities** (`src/utils/`):
- `path.js` — `SYC_DIR`/`ENV_DIR` constants, `~` expansion, path validation (A must be absolute, B must be relative and confined to `~/.syc/`), path state detection (?/l/f/d), backup naming
- `logger.js` — wraps @clack/prompts log methods + writes daily log files to `~/.syc/.logs/`

**Config** (`src/config/`):
- `loader.js` — dynamic-imports `~/.syc/config.js` with cache-busting, validates shell types and path constraints
- `template.js` — default config template string for `syc init`

## Conventions

- ESM (`"type": "module"` in package.json), all imports use `.js` extensions
- Chinese comments and user-facing messages throughout
- Symlink mapping notation: A is the original config path (absolute, supports `~`), B is relative to `~/.syc/`
- Backup format: `{filepath}-{YYMMDD_HHmmss}.dc.backup`
