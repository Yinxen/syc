export const CONFIG_TEMPLATE = `export default {
    env: {
        // 需要注入环境变量的 shell 类型
        shells: ['bash', 'zsh', 'fish'],
        // 声明式配置管理环境变量
        values: {
            // 'MY_VAR': 'my-value',
            // 同时也支持通过数组去配置 PATH
            // 'PATH': [
            //     '$HOME/.local/bin',
            //     '$PATH'
            // ]
        }
    },

    // 通过软链接集中管理配置文件
    // A: B — A 是原始配置路径(绝对路径), B 是相对于 ~/.syc/ 的路径
    symlinks: {
        // '~/.zshrc': 'zsh/zshrc',
        // '~/.config/nano/nanorc': 'nano/nanorc',
    },
}
`;
