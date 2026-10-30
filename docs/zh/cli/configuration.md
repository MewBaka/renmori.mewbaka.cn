---
title: 配置文件 renmori.toml
description: renmori.toml 的查找顺序、与命令行参数的合并规则，以及 [protect] 与 [keys] 中的全部配置键
---

# 配置文件 renmori.toml

`renmori protect` 无需任何配置即可运行。需要固定团队内的保护参数，或在 CI 中复用同一套设置时，可以使用 TOML 格式的配置文件 `renmori.toml`。配置文件中的所有键都是可选的，未设置的键使用默认值。

## 查找顺序

1. 通过 `-c, --config FILE` 指定的文件。文件不存在时命令以退出码 2 失败
2. 构建根目录下的 `renmori.toml`，即 `<game-dir>/renmori.toml`
3. 当前工作目录下的 `renmori.toml`

使用第一个找到的文件，并在 stderr 中提示所用路径。三处均不存在时使用全部默认值。

:::tip
放在构建根目录中的 `renmori.toml` 位于 `game/` 之外，不会被封包，但会随构建目录一同存在。若不希望配置文件出现在发行版中，请将其放在工作目录中，或通过 `-c` 指定其他位置。
:::

读取配置文件需要 Python 3.11 及以上版本；在 Python 3.9 或 3.10 上需要额外安装 `tomli`，否则命令以退出码 2 失败。

## 合并规则

| 设置 | 规则 |
|---|---|
| 一般设置 | 命令行参数 > 配置文件 > 默认值 |
| 排除列表 | 不覆盖，按 `steam_appid.txt`（内置）、`keep_on_disk`、`exclude`、命令行 `--exclude` 的顺序合并 |
| `lockdown` | 配置文件可设置 `true` 或 `false`；命令行 `--no-lockdown` 优先，强制关闭 |
| `keep_plaintext`、`launcher` | 配置文件或命令行任一处开启即生效 |

## `[protect]` 节

| 键 | 类型 | 默认值 | 对应参数 | 说明 |
|---|---|---|---|---|
| `strength` | 字符串 | 未设置（完整保护） | `--strength` | 保护强度，取值 `baseline`、`auto` 或插件声明的强度 |
| `lockdown` | 布尔 | `true` | `--no-lockdown` | 在受保护构建中关闭开发者模式、开发者控制台与数据导出子命令 |
| `chunk_size` | 整数 | `65536` | `--chunk-size` | 容器分块大小，单位为字节 |
| `keep_plaintext` | 布尔 | `false` | `--keep-plaintext` | 保护后保留明文原件，仅用于排查问题 |
| `exclude` | 字符串数组 | `[]` | `--exclude` | 保留在磁盘上、不加密的文件模式 |
| `keep_on_disk` | 字符串数组 | `[]` | — | 由引擎之外的程序读取、须保留为明文的文件模式；`steam_appid.txt` 始终包含在内 |
| `platforms` | 字符串数组 | 自动检测 | `--platforms` | 仅插件：目标平台列表 |
| `launcher` | 布尔 | `false` | `--launcher` | 仅插件：将密钥绑定到原生启动器并随构建分发 |

### `strength`

| 取值 | 行为 |
|---|---|
| 未设置 | 完整保护，需要闭源插件；插件不可用时失败 |
| `"baseline"` | 开源基线格式，不使用插件 |
| `"auto"` | 插件可用时使用完整保护，否则使用基线 |
| 插件声明的取值 | 例如多态强度 `"poly"`，交由插件处理 |

详细区别参阅 [保护强度与闭源插件](./plugin.md)。

### `lockdown`

开启时，运行时会将 `config.developer` 与 `config.console` 设为 `False`，并拒绝执行 Ren'Py 命令行子命令 `compile`、`dialogue`、`translate`、`add_from`、`merge_strings`。这些子命令可将脚本与文本数据导出到磁盘，在发布版本中应当禁用。仅在内部测试构建中需要使用开发者控制台时设为 `false`。

### `chunk_size`

每个分块独立加密并附带 16 字节认证标签。默认值 65536 字节对应约 0.024% 的体积开销。较大的分块有利于大型 CG 与视频的顺序读取，较小的分块可降低大量小文件的额外开销。完整保护的分块参数由插件按构建确定。

### `exclude` 与 `keep_on_disk`

两者都使匹配的文件保留在磁盘上且不加密，区别在于用途：`keep_on_disk` 用于声明由引擎之外的程序读取的文件，`exclude` 用于其他需要保持明文的情况。模式与游戏相对路径匹配，使用 Python `fnmatch` 语义，`*` 可以跨越目录分隔符，在 Windows 上不区分大小写。

```toml
[protect]
keep_on_disk = ["steam_appid.txt", "thirdparty/sdk_config.json"]
exclude = ["licenses/*"]
```

:::danger
不要排除脚本文件。运行时加载器会拒绝打开 `game/` 中位于磁盘上的 `.rpy`、`.rpyc`、`.rpym`、`.rpymc` 等脚本类文件，被排除的脚本将无法加载。
:::

### `platforms`

仅对插件生效，未设置时由插件根据构建中的 `lib/py3-*` 目录检测。可用取值由插件决定，例如：

```toml
platforms = ["win-x64", "linux-x64", "mac-universal"]
```

### `launcher`

仅对插件生效。开启后，密钥与原生启动器绑定，并随构建一同分发，只有通过该启动器启动游戏时密钥才会被重建。

## `[keys]` 节

`[keys]` 仅对基线保护生效，用于指定容器密钥与脚本密钥的来源。完整保护由插件自行派生密钥，并忽略此节。

| 键 | 说明 |
|---|---|
| `master_env` | 保存容器主密钥的环境变量名 |
| `script_env` | 保存脚本密钥的环境变量名 |

规则：

- 环境变量的值必须是 64 个十六进制字符，即 32 字节密钥；格式错误时命令以退出码 2 失败
- 未设置 `master_env` 或 `script_env` 时，为本次构建生成随机密钥
- 设置了键名但环境变量不存在或为空时，在 stderr 中提示，并同样生成随机密钥
- 摘要面板中会显示密钥来源，例如 `master=env:RENMORI_MASTER_KEY · script=随机`

```toml
[keys]
master_env = "RENMORI_MASTER_KEY"
script_env = "RENMORI_SCRIPT_KEY"
```

生成密钥的一种方式：

```bash
python -c "import os; print(os.urandom(32).hex())"
```

密钥在 CI 中的保存方式参阅 [CI 集成](../integration/ci.md)。

:::warning
基线格式会将密钥以明文形式写入随游戏分发的加载器扩展，固定密钥只能保证多次构建之间的一致性，并不能提高基线的安全性。基线的定位参阅 [保护强度与闭源插件](./plugin.md)。
:::

## 完整示例

```toml
# renmori.toml

[protect]
# 未设置 strength 时使用完整保护；"auto" 在插件不可用时回退到基线
strength = "auto"

# 发布版本保持开启
lockdown = true

# 仅基线生效；完整保护由插件确定分块参数
chunk_size = 65536

# 切勿在发布版本中开启
keep_plaintext = false

# 保留为明文的文件
exclude = []
keep_on_disk = ["steam_appid.txt"]

# 仅插件
# platforms = ["win-x64", "linux-x64", "mac-universal"]
launcher = false

[keys]
# 仅基线
# master_env = "RENMORI_MASTER_KEY"
# script_env = "RENMORI_SCRIPT_KEY"
```

仓库中的示例文件：[examples/renmori.toml](https://github.com/MewBaka/RenMori/blob/main/examples/renmori.toml)。
