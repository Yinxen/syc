# syc

Linux 下的 dotfile 配置管理工具 — 通过软链接集中管理配置文件，通过声明式配置管理环境变量。

## 安装

```bash
# 克隆仓库后本地安装
pnpm install
pnpm run install

# 或通过 npm 全局安装（发布后）
npm i -g syc

npm i -g 
```

## 快速开始

```bash
# 初始化配置文件 ~/.syc/config.js
syc
# 选择 init，然后编辑生成的配置文件
```

编辑 `~/.syc/config.js`：

```javascript
export default {
    env: {
        shells: ['bash', 'zsh', 'fish'],
        values: {
            'DEEPSEEK_API_KEY': 'sk-xxx',
            'DEEPSEEK_TOKEN': 'Bearer $DEEPSEEK_API_KEY',
            'PATH': [
                '$HOME/.local/bin',
                '$HOME/.bun/bin',
                '$PATH'
            ]
        }
    },

    symlinks: {
        '~/.zshrc': 'zsh/zshrc',
        '~/.config/nano/nanorc': 'nano/nanorc',
    },
}
```

再次运行 `syc`，选择对应操作即可。

## 功能

### 环境变量管理

将 `env.values` 中声明的环境变量生成为 shell 脚本（`~/.syc/.env/env.sh` 和 `env.fish`），并自动注入 `source` 片段到对应 shell 的 rc 文件中。

- **inject** — 生成环境变量文件并注入 source 到 rc 文件
- **uninject** — 注释掉 rc 文件中的 source 片段

支持的 shell：`bash`、`zsh`、`fish`

### 配置文件软链接管理

将分散在系统各处的配置文件集中到 `~/.syc/` 目录下，原位置替换为软链接。

- **link** — 将配置文件移入 `~/.syc/` 并在原位置创建软链接
- **unlink** — 将软链接还原为实体文件（从 `~/.syc/` 复制回原位置）

当发生冲突时，提供三种策略：`backup`（备份后操作）、`overwrite`（直接覆盖）、`skip`（跳过）。

## 配置说明

| 字段 | 说明 |
|------|------|
| `env.shells` | 需要注入环境变量的 shell 类型数组 |
| `env.values` | 环境变量键值对，值为字符串或数组（数组用 `:` 拼接，适用于 PATH） |
| `symlinks` | 软链接映射，key 为原始路径（绝对路径，支持 `~`），value 为相对于 `~/.syc/` 的目标路径 |

## 卸载

```bash
pnpm run uninstall
```
