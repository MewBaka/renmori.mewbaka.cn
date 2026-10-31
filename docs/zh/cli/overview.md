---
title: CLI 概览
description: renmori 命令行工具的定位、安装方式、命令结构、通用选项与环境变量
---

# CLI 概览

`renmori` 是 RenMori 的命令行工具，作用于 Ren'Py 启动器生成的发行版构建，在构建期完成资产封包、脚本变换、加载器写入与结果校验。它不读取也不修改游戏源码工程，不依赖 Ren'Py SDK，除首次下载闭源插件外不访问网络。

一次典型的发布流程只涉及两条命令：

```bash
renmori protect ./dist/MyGame-1.0-pc -o ./dist/MyGame-1.0-pc-protected
renmori verify  ./dist/MyGame-1.0-pc-protected
```

## 工具的职责边界

| 阶段 | 由谁完成 | 说明 |
|---|---|---|
| 编写剧本与资源 | 开发者，Ren'Py SDK | RenMori 不参与 |
| 生成发行版构建 | Ren'Py 启动器 *Build Distributions* | RenMori 的输入 |
| 封包、加密、脚本变换、写入加载器 | `renmori protect` | 输出受保护的发行版构建 |
| 校验受保护构建 | `renmori verify` | 可作为 CI 门禁 |
| 运行时解密 | 随游戏分发的加载器扩展与原生核心 | 在玩家机器上、引擎内部完成 |
| 上传与分发 | 开发者，SteamPipe、itch.io 等 | 参阅 [发布到 Steam](../integration/steam-release.md) |

## 安装

`renmori` 以 PyPI 包 `renmori` 发布，需要 Python 3.9 及以上版本。依赖 `cryptography` 会随安装自动获取，该依赖仅供构建期工具使用，受保护的游戏在运行时不依赖任何 pip 包。

```bash
pip install renmori
renmori --version
```

作为独立命令行工具安装时，也可以使用 uv 或 pipx，二者会为 `renmori` 创建隔离环境：

```bash
uv tool install renmori
pipx install renmori
```

读取 `renmori.toml` 配置文件需要 Python 3.11 及以上版本的标准库 `tomllib`；在 3.9 或 3.10 上使用配置文件时，需要额外安装 `tomli`：

```bash
pip install tomli
```

如需修改源码或参与开发，可从仓库以可编辑模式安装：

```bash
git clone https://github.com/MewBaka/RenMori.git
cd RenMori
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .
```

## 调用方式

安装后可通过两种等价方式调用：

```bash
renmori <command> [options]
python -m renmori <command> [options]
```

当系统中存在多个 Python 环境、`renmori` 不在 `PATH` 中时，第二种方式可明确指定使用哪一个解释器。

## 命令一览

| 命令 | 作用 | 参考 |
|---|---|---|
| `renmori protect <构建目录 \| 构建.zip>` | 保护一个发行版构建：封包并加密全部资产，变换已编译脚本，删除明文原件，写入加载器扩展与构建清单 | [protect](./protect.md) |
| `renmori verify <受保护目录>` | 依据构建清单重新校验受保护构建：容器哈希、必需文件、明文残留 | [verify](./verify.md) |
| `renmori gui` | 打开基于 Tkinter 的图形界面，在窗口中完成保护、校验与 `renmori.toml` 编辑 | [gui](./gui.md) |
| `renmori --version` | 打印工具名称与版本号后退出 | — |
| `renmori -h`、`renmori <command> -h` | 打印帮助信息后退出 | — |

## 通用选项

以下选项对 `protect` 与 `verify` 均有效，须写在子命令之后，例如 `renmori protect ./build --quiet`。

| 选项 | 默认值 | 作用 |
|---|---|---|
| `--lang {auto,en,zh}` | `auto` | 设置面向用户的输出语言。`auto` 依次读取 `RENMORI_LANG`、`LC_ALL`、`LC_MESSAGES`、`LANG`、`LANGUAGE` 与系统区域设置，以 `zh` 开头时使用中文，否则使用英文；在 Windows 上还会读取系统界面语言 |
| `--no-color` | 关闭 | 禁用 ANSI 颜色。stderr 不是终端或设置了 `NO_COLOR` 环境变量时，颜色会自动禁用 |
| `--quiet` | 关闭 | 不输出带样式的进度信息，仅在 stdout 输出最后一行 JSON；错误信息以 `error: <message>` 的纯文本形式写入 stderr。同时视为非交互模式，跳过全部确认提示 |

:::tip
CLI 的输出语言目前支持中文与英文。输出语言只影响 stderr 上的进度信息，stdout 上的 JSON 键名与取值始终为英文，因此在任意区域设置下解析结果都保持一致，详见 [输出、构建清单与退出码](./output.md)。
:::

## 环境变量

| 环境变量 | 适用命令 | 作用 |
|---|---|---|
| `RENMORI_LANG` | 全部 | 固定输出语言，取值 `en` 或 `zh`，优先级高于区域设置变量 |
| `NO_COLOR` | 全部 | 设置后禁用 ANSI 颜色 |
| `RENMORI_PLUGIN` | `protect` | 闭源插件可执行文件的路径，等同于 `--plugin`，设置后不再自动下载 |
| `RENMORI_NO_DOWNLOAD` | `protect` | 设置为任意非空值后不自动下载插件；插件缺失时完整保护直接失败，`--strength auto` 回退到基线 |
| `RENMORI_PLUGIN_BASE_URL` | `protect` | 从该地址获取插件与 `SHA256SUMS`，用于内网镜像 |
| `RENMORI_PLUGIN_TAG` | `protect` | 指定拉取插件的 Release 标签，同时决定本地缓存目录 |
| `XDG_CACHE_HOME`、`LOCALAPPDATA` | `protect` | 决定插件缓存的根目录，参阅 [保护强度与闭源插件](./plugin.md) |
| 配置文件 `[keys]` 中指定的变量 | `protect` | 基线保护的容器密钥与脚本密钥来源，参阅 [配置文件](./configuration.md) |

## 处理流程概览

```
Ren'Py 启动器 Build Distributions
        │  发行版构建目录，或 *-pc.zip 等发行归档
        ▼
renmori protect
  1. 解析输入（目录，或解压 .zip 并定位含 game/ 的构建根目录）
  2. 合并配置（命令行 > renmori.toml > 默认值）
  3. 确定保护强度，按需获取并校验闭源插件
  4. 预检：输出或备份目录冲突、待封包文件数量
  5. 打印摘要并确认（仅交互式终端）
  6. 复制或备份 → 封包加密 → 变换脚本 → 删除明文 → 写入加载器扩展 → 写入构建清单
        │  受保护的发行版构建
        ▼
renmori verify  →  校验通过后上传或打包分发
```

## 相关页面

- [`renmori protect`](./protect.md)：全部参数、文件处理规则与执行流程
- [`renmori verify`](./verify.md)：校验项目与使用方式
- [`renmori gui`](./gui.md)：图形界面的运行环境、各控件与 CLI 参数的对应关系
- [配置文件 renmori.toml](./configuration.md)：全部配置键与合并规则
- [输出、构建清单与退出码](./output.md)：供脚本与 CI 解析的输出格式
- [保护强度与闭源插件](./plugin.md)：基线保护与完整保护的区别，插件的获取与缓存
- [故障排查](./troubleshooting.md)：全部错误信息及处理方式
