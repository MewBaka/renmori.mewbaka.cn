---
pageType: home
titleSuffix: "Ren'Py 游戏加密与防解包工具，免费商用"
description: "RenMori 是免费可商用的 Ren'Py 游戏加密工具，把脚本、立绘、CG、音频、视频与字体封入加密容器，让 unrpa、rpatool、unrpyc 等解包与反编译工具失效。无需改动源码，支持 Windows、macOS、Linux 与 Steam 发行"

hero:
  name: RenMori
  text: |
    面向商业 Ren'Py 视觉小说的
    全量加密与防解包工具
  tagline: 由 MewBaka 发布，无感地保护你的视觉小说游戏
  image:
    src: /renmori-protector.svg
    alt: RenMori
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: GitHub
      link: https://github.com/MewBaka/RenMori

features:
  - title: 全量数据加密
    icon: /icons/lock.svg
    details: 脚本、立绘、CG、音频、视频、字体、翻译与配置全部封入加密容器，仅在运行中的引擎内部解密，磁盘上不留存明文资源
  - title: 零侵入接入
    icon: /icons/package.svg
    details: 直接处理 Ren'Py 启动器生成的发行版构建或 <code>.zip</code> 压缩包，无需改动项目源码与既有开发流程
  - title: 构建级差异化
    icon: /icons/shuffle.svg
    details: 每次构建生成的保护各不相同，针对单一作品或版本的逆向成果无法沿用到其他构建
  - title: 默认零配置
    icon: /icons/sliders.svg
    details: 开箱即用，可选的 <code>renmori.toml</code> 用于控制分块大小、排除清单、锁定、保护强度与密钥来源
  - title: 面向 CI 设计
    icon: /icons/branch.svg
    details: 输出机读 JSON 结果与明确的退出码，<code>renmori verify</code> 可作为流水线门禁，随每次发行版构建自动完成封包与校验
  - title: 免费商用
    icon: /icons/heart.svg
    details: 保护任何 Ren'Py 游戏均免费，包括商业作品，运行时可随游戏一同免费再分发
---
