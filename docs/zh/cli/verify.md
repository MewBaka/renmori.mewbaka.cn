---
title: renmori verify
description: 依据构建清单校验受保护构建的完整性与明文残留，可作为发布前检查或 CI 门禁
---

# renmori verify

`renmori verify` 依据受保护构建自身的 `renmori-manifest.json`，检查该构建在保护完成后是否被改动、是否缺少运行所需的文件，以及磁盘上是否残留可被直接提取的明文脚本或封包。它只读取文件，不修改任何内容，可以在发布前手动执行，也可以作为 CI 流水线的门禁步骤。

## 语法

```bash
renmori verify <protected-dir> [--lang {auto,en,zh}] [--no-color] [--quiet]
```

| 参数 | 说明 |
|---|---|
| `protected-dir` | 由 `renmori protect` 生成的受保护构建根目录，即包含 `renmori-manifest.json` 与 `game/` 的目录 |

## 检查项目

| 检查 | 失败时报告的问题 |
|---|---|
| 构建根目录存在 `renmori-manifest.json` | `no renmori-manifest.json in <dir>`，以退出码 2 立即结束 |
| `game/renmori.rmc` 存在 | `missing renmori.rmc` |
| `game/renmori.rpe` 存在 | `missing renmori.rpe` |
| 容器文件的 SHA-256 与清单中的 `container_sha256` 一致 | `container sha mismatch` |
| `game/` 及其全部子目录中不存在 `.rpa`、`.rpyc`、`.rpy`、`.rpyb`、`.rpymc` 文件 | `plaintext left: <path>`，只报告找到的第一个 |

除构建清单缺失会立即结束外，其余检查的结果会汇总后一并报告。任一检查失败时，命令列出全部问题并以退出码 1 结束。

容器哈希检查可以发现以下情况：容器在保护后被替换、被截断或在传输中损坏，以及构建清单来自另一次保护。明文残留检查覆盖 `cache/` 目录，因为该目录中的 `.rpyb` 文件包含脚本的已编译字节码。

## 检查范围之外的内容

`verify` 是静态的文件检查，以下内容不在其范围内：

- 不运行游戏，也不解密容器，因此无法确认每一项资产都能被引擎正确读取。端到端验证可使用仓库中的 [`tools/verify_in_renpy.py`](https://github.com/MewBaka/RenMori/blob/main/tools/verify_in_renpy.py)，在真实的 Ren'Py SDK 中加载受保护构建
- 不检查 `game/` 之外的文件，例如各平台启动器与 `lib/` 中的运行时
- 不检查 `exclude` 或 `keep_on_disk` 保留在磁盘上的非脚本文件，这些文件按设计以明文存在
- 不判断构建使用的保护强度是否满足发布要求；保护强度记录在清单的 `strength` 字段中，可由流水线另行检查

## 输出

进度信息输出到 stderr，最后一行 JSON 输出到 stdout。

校验通过：

```json
{"status": "ok", "file_count": 842, "container_sha256": "9f2c…"}
```

校验失败：

```json
{"status": "error", "problems": ["container sha mismatch", "plaintext left: game/script.rpyc"]}
```

缺少构建清单：

```json
{"status": "error", "message": "no renmori-manifest.json in /path/to/build"}
```

字段含义与退出码参阅 [输出、构建清单与退出码](./output.md)。

## 退出码

| 退出码 | 含义 |
|---:|---|
| 0 | 全部检查通过 |
| 1 | 至少一项检查失败 |
| 2 | 目录中不存在 `renmori-manifest.json` |

## 示例

发布前手动校验：

```bash
renmori verify ./dist/MyGame-1.0-pc-protected
```

在 CI 中作为门禁，只输出 JSON：

```bash
renmori verify ./build/MyGame-pc-protected --quiet
```

在 shell 脚本中根据结果决定是否继续上传：

```bash
if renmori verify ./out --quiet > verify.json; then
  echo "verified"
else
  cat verify.json
  exit 1
fi
```

:::tip
`protect` 与 `verify` 之间不应再对构建做任何改动。若需要调整内容，请从全新的发行版构建或备份重新执行 `protect`，而不是修改受保护目录。
:::
