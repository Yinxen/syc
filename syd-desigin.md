# DotFile Config Manage (syc) ： linux 配置文件管理
## 配置文件软链接管理 
  ### 链接配置 
    链接到 ~/.dc/xxx/xxx
  ### 还原配置 
    将（symlink）还原成真实的文件或文件夹

## 环境变量管理
  ### 环境变量解析生成 （env.sh, env.fish）
    解析env环境变量，然后生成环境变量文件
  ### 环境变量注入
    追加或取消注释 source 片段
  ### 取消注入
    注释 source 片段

## 代码规范
- 工具化
- 模块化
- 可维护性，可读性，可扩展性
- 中文注释， 逻辑密集区需要详细注释
  
代码库：commander构建cli , prompts 构建cli交互


## 交互 
prmpot:
    radio():单选
    checkbox(): 多选
symlinks:{
    A:B
}
orgiginal_config_paths 是所有注册在 symlinks 的A 集合按名称排序

cli ： dc
- radio(env|symlinks|all|cancel)
  - env: 注入环境变量
    - radio(inject|uninject)
      - inject: 注入环境变量
        - 解析env然后生成 shell:[] 配置的shell语法的环境变量
        - 检查/注入/维护 各个 shell rc 的配置文件的片段
      - uninject: 取消注入环境变量

  - symlinks: 配置文件链接化管理
    - radio(link|unlink)
      - link：
        - checkbox(all|...[original_config_paths]) , Tip: A -> B , so A is original_config_path
          - 对选中的目标依次进行链接化处理或维护
            - 冲突解决方案 简化术语 文件或目录不存在：？ ，是链接:l ，是文件：f ,是目录: d
              - A(?) -> B(?) : 警告：配置均不存在
              - A(?) -> B(f) : 重建软链接 A -> B
              - A(?) -> B(d) : 重建软链接 A -> B
              - A(l) -> B(?) : 警告: 配置文件缺失,链接文件无效
              - A(l) -> B(f) : 检查软链接指向是否正确，若不正确则自动维护软链接
              - A(l) -> B(d) ：检查软链接指向是否正确，若不正确则自动维护软链接
              - A(f|d) -> B(?) : backup
              - A(f|d) -> B(f) : 冲突：询问用户如何处理冲突（backup,overwrite,skip）
              - A(f|d) -> B(d) : 冲突：询问用户如何处理冲突（backup,overwrite,skip）
      - unlink：
        - checkbox(all|...[original_config_paths])
          - 对选中的目标依次进行配置还原（symlink 将编成实体文件或目录）
            - 冲突解决方案 简化术语 文件或目录不存在：？ ，是链接:l ，是文件：f ,是目录: d
              - A(?) -> B(?) : 警告：配置均不存在
              - A(?) -> B(f) : 复制B 到 A ，并保持文件名与A一致
              - A(?) -> B(d) : 复制B 到 A ，并保持文件名与A一致
              - A(l) -> B(?) : 警告: 配置文件缺失,链接文件无效
              - A(l) -> B(f) : 复制B 到 A ，并保持文件名与A一致
              - A(l) -> B(d) ： 复制B 到 A ，并保持文件名与A一致
              - A(f|d) -> B(?) : 警告：配置缺失，无法还原
              - A(f|d) -> B(f) : 冲突：询问用户如何处理冲突（backup,overwrite,skip）
              - A(f|d) -> B(d) : 冲突：询问用户如何处理冲突（backup,overwrite,skip）
          - 
  - all: 执行全部操作
  - cancel: 取消操作
- link时的冲突策略处理方案 
  - backup : 
    - 备份原来的文件或文件夹 {filename}-{YYMMDD_HHmmss}.dc.backup
    - 将A 移动到 B
    - 创建 软链接 A -> B
  - overwrite:
    - 删除A 
    - 创建 软链接 A -> B
  - skip:
    - 跳过处理，AB都保持原样
- unlink时冲突策略处理方案
   - backup : 
    - 备份原来的文件或文件夹 {filename}-{YYMMDD_HHmmss}.dc.backup
    - 将B 复制到 A
    - 保证 文件名与 A一致
  - overwrite:
    - 删除A 
    - 将B 复制到 A
    - 保证 文件名与 A一致
  - skip:
    - 跳过处理，AB都保持原样
  - 
## config sample
~/.dc/config.js
```javascript
export default {
    env:{
        //需要注入环境变量的shell
        shells:['bash','zsh','fish'],
        //声明式配置管理环境变量
        values:{
            'DEEPSEEK_API_KEY':"sk-deepseek-api-key-xxxx",
            'DEEPSEEK_TOKEN':'Bearer $DEEPSEEK_API_KEY',
            //同时也支持通过数组去配置PATH
            'PATH':[
                '$HOME/.local/bin',
                '$HOME/.bun/bin',
                '$HOME/.custom',
                '$PATH'
            ]
        }
    },

    //通过软链接配置文件,集中化管理
    symlinks:{
        //A:B    A -> B
        '~/.zshrc':'zsh/zshrc',
        '~/.config/nano/nanorc':'nano/nanorc',
        '~/.config/custom/custom.json':'custom/custom-config.json'
    },
    
}