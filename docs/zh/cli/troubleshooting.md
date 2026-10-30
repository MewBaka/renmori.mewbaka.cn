---
title: 故障排查
description: renmori protect 与 renmori verify 的全部错误信息、原因与处理方式，以及运行受保护构建时的常见问题
---

# 故障排查

错误信息以英文写入 stdout 的结果 JSON（`message` 或 `problems` 字段），stderr 中的提示与之相同。下表按命令与阶段列出全部错误及处理方式，退出码的含义参阅 [输出、构建清单与退出码](./output.md)。

## protect：输入

| 错误信息 | 退出码 | 原因与处理 |
|---|---:|---|
| `<dir> has no 'game/' directory` | 2 | 输入目录中没有 `game/`。请传入发行版构建的根目录，而不是 `game/` 本身，也不是 Ren'Py 源码工程目录 |
| `<dir> is already protected (found renmori.rmc)` | 2 | `game/` 中已存在 `renmori.rmc`。请从全新的发行版构建或 `_bak` 备份重新执行 |
| `no 'game/' directory found in the archive` | 2 | `.zip` 中找不到包含 `game/` 的构建，请传入启动器生成的发行归档 |
| `the archive holds more than one game build (…)` | 2 | `.zip` 的顶层包含多个构建。先解压，再将 `renmori` 指向需要保护的那一个 |
| `unsafe path in archive: <member>` | 2 | 归档中存在会解压到目标目录之外的成员，命令拒绝处理。请重新生成归档 |
| `output <dir> already exists` | 2 | `-o` 指定的目录，或由 `.zip` 推导出的输出目录已经存在。删除该目录或换用其他路径 |
| `nothing to pack under <dir>/game` | 2 | `game/` 中没有可封包的文件，可能全部被 `exclude` 匹配，或构建本身为空 |

## protect：配置与密钥

| 错误信息 | 退出码 | 原因与处理 |
|---|---:|---|
| `config not found: <path>` | 2 | `-c` 指定的文件不存在 |
| `reading renmori.toml needs Python 3.11+ or the 'tomli' package` | 2 | 当前 Python 低于 3.11，且未安装 `tomli`。执行 `pip install tomli` 或升级 Python |
| `<VAR> must be hex` | 2 | `[keys]` 指定的环境变量包含非十六进制字符 |
| `<VAR> must be 32 bytes (64 hex chars), got <n>` | 2 | 密钥长度不是 32 字节。请使用 64 个十六进制字符 |
| `<VAR> not set; using a random key`（提示） | — | `[keys]` 指定的环境变量不存在或为空，本次构建改用随机密钥。在 CI 中请检查 Secret 是否已注入 |

## protect：保护强度与插件

| 错误信息 | 退出码 | 原因与处理 |
|---|---:|---|
| `full protection needs the closed plugin; …` | 2 | 未设置强度时需要插件，但插件不可用：下载被拒绝、设置了 `RENMORI_NO_DOWNLOAD`、网络失败或当前平台没有可下载的插件。允许下载，或通过 `--plugin`、`RENMORI_PLUGIN` 指定插件，或显式使用 `--strength baseline` |
| `strength '<s>' requires the closed renmori plugin; …` | 2 | 指定的强度需要插件，但插件不可用或不支持该强度 |
| `Downloaded plugin failed its checksum; discarded`（提示） | — | 下载的文件与 `SHA256SUMS` 不一致，已丢弃。重试，或检查 `RENMORI_PLUGIN_BASE_URL` 指向的镜像是否完整 |
| `Could not download the plugin: <err>`（提示） | — | 网络错误，或 `SHA256SUMS` 中没有对应条目。检查网络与代理设置，或改用预先缓存的插件 |
| `plugin not found, ignoring: <path>`（提示） | — | `--plugin` 或 `RENMORI_PLUGIN` 指向的文件不存在，已忽略并继续查找缓存或下载 |
| `plugin interface <n> unsupported (need <m>); ignoring it`（提示） | — | 插件的接口版本过旧。升级插件，或删除缓存后重新下载 |
| `plugin protection failed: <message>` | 1 | 插件执行失败。原始构建已恢复，`-o` 的不完整输出已删除。根据插件输出到 stderr 的信息排查 |

## protect：执行

| 错误信息 | 退出码 | 原因与处理 |
|---|---:|---|
| `backup <dir>_bak already exists; …` | 2 | 上一次原地保护的备份仍在。删除它、改用 `-o`，或在确认无需备份时使用 `--no-backup` |
| `{"status": "aborted"}` | 2 | 在确认提示处未回答 `y`。CI 中不会出现提示 |
| `packing failed: unsupported RPA archive format: …` | 1 | `.rpa` 封包不是 RPA-3.0 或 RPA-2.0 格式，通常由第三方工具生成。请改用 Ren'Py 启动器生成的标准封包 |
| `packing failed: <err>` | 1 | 封包过程中出现文件读写错误，例如磁盘空间不足或文件被占用 |
| `warning: could not remove <path>: <err>`（提示） | — | 封包后删除明文原件失败。随后执行的 `renmori verify` 会报告残留，请手动删除后重新校验 |

## verify

| 错误信息 | 退出码 | 原因与处理 |
|---|---:|---|
| `no renmori-manifest.json in <dir>` | 2 | 目录中没有构建清单。确认传入的是 `protect` 的输出目录，且清单未被移除 |
| `missing renmori.rmc` | 1 | 容器文件缺失 |
| `missing renmori.rpe` | 1 | 加载器扩展缺失，游戏将无法读取任何受保护资源 |
| `container sha mismatch` | 1 | 容器在保护后被改动、替换或在传输中损坏，或清单与容器不属于同一次保护。重新执行 `protect` |
| `plaintext left: <path>` | 1 | `game/` 中残留 `.rpa`、`.rpyc`、`.rpy`、`.rpyb` 或 `.rpymc`。常见原因：使用了 `--keep-plaintext`、明文删除失败，或保护后又向目录中复制了文件 |

## 运行受保护构建时的问题

| 现象 | 原因与处理 |
|---|---|
| 游戏启动后找不到图像或脚本 | 发行版缺少 `renmori.rmc` 或 `renmori.rpe`。两者必须一同分发 |
| 再次使用 Ren'Py 启动器构建后保护消失 | 启动器会从源码工程重新构建。保护应始终是构建之后的最后一步，不要对受保护目录运行启动器 |
| 被 `exclude` 的脚本无法加载 | 运行时加载器拒绝打开磁盘上的脚本类文件。不要排除脚本 |
| 需要在测试构建中使用开发者控制台 | 使用 `--no-lockdown` 生成内部测试构建，发布版本保持锁定 |
| Ren'Py 的 `compile`、`dialogue`、`translate` 等命令行子命令被拒绝 | 锁定开启时的预期行为 |
| Steam SDK 无法识别游戏 | 确认 `steam_appid.txt` 仍以明文保留在磁盘上。该文件默认保留，若使用了自定义构建流程请检查是否被移除。发布流程参阅 [发布到 Steam](../integration/steam-release.md) |
| CI 中从未出现确认提示 | 预期行为。提示仅在交互式终端中出现 |
| 输出中出现乱码或颜色控制字符 | 使用 `--no-color`，或设置 `NO_COLOR` 环境变量 |

问题未在上表中列出时，请在 [GitHub Issues](https://github.com/MewBaka/RenMori/issues) 中附上命令、`renmori --version` 的输出与完整的错误信息提交反馈，或发送邮件至 [team@mewbaka.cn](mailto:team@mewbaka.cn)。
