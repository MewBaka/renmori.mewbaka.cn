---
title: 输出、构建清单与退出码
description: renmori 的 stderr 与 stdout 输出约定、结果 JSON 的字段、renmori-manifest.json 的格式，以及全部退出码
---

# 输出、构建清单与退出码

`renmori` 同时面向开发者与自动化流水线：开发者阅读 stderr 上带样式、已本地化的进度信息，脚本与 CI 解析 stdout 上的结果 JSON 与退出码。两者相互独立，输出语言与颜色设置不会影响 stdout 的内容。

## 输出通道

| 通道 | 内容 | 受 `--lang`、`--no-color` 影响 | 受 `--quiet` 影响 |
|---|---|---|---|
| stderr | 横幅、配置提示、摘要面板、确认提示、步骤行、结果面板、发布指引、错误信息 | 是 | 是，仅保留 `error: <message>` 形式的错误信息 |
| stdout | 最后一行始终是一个 JSON 对象 | 否 | 否 |

JSON 的键名与取值始终为英文，在任意区域设置下结构相同。解析时应读取 stdout 的最后一行。

## `protect` 的结果 JSON

保护成功：

```json
{
  "status": "ok",
  "output": "/abs/path/MyGame-1.0-pc-protected",
  "manifest": {
    "file_count": 842,
    "container_sha256": "9f2c…",
    "strength": "baseline"
  },
  "backup": "/abs/path/MyGame-1.0-pc_bak"
}
```

实际输出为单行 JSON，此处为便于阅读而格式化。

| 字段 | 说明 |
|---|---|
| `status` | `"ok"` |
| `output` | 受保护构建的绝对路径 |
| `manifest.file_count` | 封入容器的文件数量 |
| `manifest.container_sha256` | 容器文件的 SHA-256 |
| `manifest.strength` | 实际使用的保护强度 |
| `backup` | 原地保护时生成的备份目录，仅在创建了备份时出现 |

失败：

```json
{"status": "error", "message": "/abs/path/MyGame has no 'game/' directory"}
```

在确认提示处取消：

```json
{"status": "aborted"}
```

## `verify` 的结果 JSON

| 结果 | JSON |
|---|---|
| 通过 | `{"status": "ok", "file_count": 842, "container_sha256": "…"}` |
| 检查失败 | `{"status": "error", "problems": ["container sha mismatch", …]}` |
| 缺少构建清单 | `{"status": "error", "message": "no renmori-manifest.json in …"}` |

## 构建清单 renmori-manifest.json

`protect` 在受保护构建的根目录写入 `renmori-manifest.json`，记录本次保护的结果，供 `verify` 与发布流程使用。该文件位于 `game/` 之外，不包含任何密钥。

### 基线保护

```json
{
  "renmori_version": "1.0.0",
  "container_format": 1,
  "strength": "baseline",
  "chunk_size": 65536,
  "lockdown": true,
  "container_sha256": "9f2c…",
  "container_bytes": 1073741824,
  "file_count": 842,
  "files": [
    {"name": "audio/theme.ogg", "size": 4194304},
    {"name": "images/bg room.png", "size": 812345}
  ]
}
```

| 字段 | 说明 |
|---|---|
| `renmori_version` | 执行保护的 `renmori` 版本 |
| `container_format` | 容器格式版本，基线为 `1`，格式定义参阅 [容器格式](../technical/container-format.md) |
| `strength` | 保护强度 |
| `chunk_size` | 分块大小，单位为字节 |
| `lockdown` | 是否开启锁定 |
| `container_sha256` | 容器文件的 SHA-256，`verify` 以此检测改动 |
| `container_bytes` | 容器文件大小，单位为字节 |
| `file_count` | 封入容器的文件数量 |
| `files` | 按名称排序的文件列表，每项包含游戏相对路径 `name` 与原始大小 `size` |

### 完整保护

```json
{
  "renmori_version": "1.0.0",
  "container_format": "poly",
  "strength": "poly",
  "lockdown": true,
  "container": "renmori.rmc",
  "container_sha256": "9f2c…",
  "file_count": 842,
  "script_count": 120,
  "platforms": ["win-x64", "linux-x64"],
  "cores": [],
  "launcher": null
}
```

| 字段 | 说明 |
|---|---|
| `container_format` | `"poly"`，表示由插件生成的逐构建多态格式 |
| `strength` | 插件报告的保护强度 |
| `container` | 插件报告的容器文件名 |
| `script_count` | 经变换的脚本数量 |
| `platforms` | 插件生成的目标平台 |
| `cores` | 插件随构建写入的原生核心 |
| `launcher` | 原生启动器信息，未启用时为空 |

完整保护的清单不包含逐文件列表。`platforms`、`cores`、`launcher` 的具体取值由插件决定，以上示例仅说明结构。

:::warning
构建清单会随构建目录一同存在。基线清单中的 `files` 列出了全部资产的路径与大小，但不包含任何内容或密钥。若不希望发行版包含该文件，可在 `verify` 完成后、上传之前将其移出；之后再次校验需要该文件。
:::

## 退出码

| 退出码 | 名称 | 触发情况 |
|---:|---|---|
| 0 | 成功 | 保护完成；校验全部通过 |
| 2 | 用法或前置条件错误 | 输入目录缺少 `game/`；构建已受保护；`-o` 目录或 `_bak` 备份已存在；配置文件不存在，或缺少 TOML 解析支持；密钥环境变量格式错误；完整保护所需的插件不可用；指定的强度插件不支持；没有可封包的文件；`.zip` 中找不到或找到多个构建、包含不安全路径或已损坏；在确认提示处取消；`verify` 找不到构建清单；命令行参数错误（由参数解析器报告，此时不输出 JSON） |
| 1 | 运行时失败 | 封包过程出错，例如遇到不支持的 RPA 格式；插件执行失败；`verify` 发现问题 |

流水线可以据此区分“输入或配置需要修正”（2）与“构建本身出现问题”（1）。各错误信息的处理方式参阅 [故障排查](./troubleshooting.md)。

## 在脚本中解析

使用 `jq` 读取结果：

```bash
renmori protect ./build/MyGame-pc --no-backup --quiet -y | tail -n 1 > result.json
jq -r '.manifest.container_sha256' result.json
```

在 Python 中读取：

```python
import json
import subprocess

proc = subprocess.run(
    ["renmori", "verify", "./out", "--quiet"],
    stdout=subprocess.PIPE, text=True,
)
result = json.loads(proc.stdout.strip().splitlines()[-1])
if proc.returncode != 0:
    raise SystemExit(result.get("problems") or result.get("message"))
```
