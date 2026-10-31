---
title: "CI 集成：在流水线中自动加密 Ren'Py 构建"
description: "在 GitHub Actions 等 CI 流水线中以非交互方式运行 RenMori，自动加密每次 Ren'Py 发行版构建，管理密钥与闭源插件缓存，并以 renmori verify 作为发布门禁"
---

# CI 集成

RenMori 是作用于标准 Ren'Py 发行版构建之上的单条构建期命令，无需改动游戏源码。其输入为任意包含 `game/` 子目录的目录，即 Ren'Py 启动器 Build Distributions 的输出。

本页仅说明 CI 场景下的用法。完整的命令行参数见 [renmori protect](../cli/protect.md)，`renmori.toml` 配置项见 [配置文件](../cli/configuration.md)，输出格式、构建清单与退出码见 [输出与退出码](../cli/output.md)。

## 流水线中的基本流程

```bash
renmori protect <game-build-dir> -o <output-dir> --quiet
renmori verify  <output-dir>
```

`protect` 将 `game/` 下的全部内容封入 `game/renmori.rmc`，变换已编译的 Ren'Py 脚本，移除明文原件，写入加载器扩展 `game/renmori.rpe`，并生成 `renmori-manifest.json`。`verify` 依据该清单重新校验受保护的构建（容器哈希、必需文件、无明文残留），适合作为 CI 门禁。

使用 `-o` 时原始构建不会被改动（受保护的是副本），因此不会创建备份。不带 `-o` 的原地保护会先将原目录复制到同级的 `<dir>_bak`，若该目录已存在则运行失败；`--no-backup` 可跳过这一复制。

stdout 的最后一行始终是一个 JSON 对象（`{"status": "ok", …}` 或 `{"status": "error", …}`），进度信息输出到 stderr。JSON 的键与值在任何语言设置下均保持英文，因此流水线解析不受输出样式与语言的影响。使用 `--quiet` 时仅输出该 JSON。流水线应以退出码判断成败，各退出码的含义见 [输出与退出码](../cli/output.md)。

## 非交互行为

RenMori 仅在交互式终端（TTY）上显示确认提示，包括原地保护前的 `[y/N]` 确认与下载闭源插件前的确认。满足以下任一条件时，所有提示都会被跳过，流水线不会因等待输入而挂起：

- 传入 `-y` / `--yes`
- 传入 `--quiet`
- stdin 不是 TTY（CI 中的常见情形）

非 TTY 环境下颜色输出自动禁用，同时遵从 `NO_COLOR`。面向用户的输出语言跟随系统区域设置，可通过 `--lang en|zh` 或环境变量 `RENMORI_LANG` 固定。

## 保护强度与闭源插件

未设置 `strength` 时，RenMori 默认采用完整保护，即闭源插件所报告的最强强度；若没有可用的插件，运行将失败，而不会静默降级为基线格式。CI 中可按需选择：

| 设置 | 行为 |
|------|------|
| 不设置（默认） | 使用插件报告的最强强度；无可用插件时运行失败 |
| `--strength auto` | 有可用插件时使用插件，否则使用基线格式 |
| `--strength baseline` | 强制使用开源基线格式，从不下载插件 |

需要插件时，RenMori 依次查找 `--plugin` 参数或 `RENMORI_PLUGIN` 环境变量指定的路径、本地缓存，最后从公开 Release 下载插件，按 `SHA256SUMS` 校验后写入缓存。在非交互环境中下载不经确认直接进行。插件的完整说明见 [闭源插件](../cli/plugin.md)。

### 在 CI 中缓存插件

插件的缓存目录按插件发布标签区分：

| 平台 | 缓存目录 |
|------|----------|
| Linux / macOS | `$XDG_CACHE_HOME/renmori/plugin/<tag>`，未设置 `XDG_CACHE_HOME` 时为 `~/.cache/renmori/plugin/<tag>` |
| Windows | `%LOCALAPPDATA%\renmori\plugin\<tag>` |

在 CI runner 之间复用该目录即可避免每次构建重复下载。以 GitHub Actions 为例，可在 Protect 步骤之前加入缓存步骤，缓存键应与 RenMori 所使用的插件发布标签保持一致：

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/renmori/plugin
    key: renmori-plugin-${{ runner.os }}-plugin-v1.2.6
```

以下环境变量可进一步控制插件的获取方式：

| 环境变量 | 作用 |
|----------|------|
| `RENMORI_PLUGIN` | 显式指定插件路径，跳过缓存与下载，适用于预先置备插件的离线 runner |
| `RENMORI_NO_DOWNLOAD=1` | 禁止自动下载；无可用插件时按强度设置失败或回退到基线 |
| `RENMORI_PLUGIN_BASE_URL` | 插件文件与 `SHA256SUMS` 的下载地址，默认为公开 Release |
| `RENMORI_PLUGIN_TAG` | 要拉取的插件发布标签，同时决定缓存子目录 |

## 密钥管理

`[keys]` 配置节仅作用于基线格式。使用闭源插件时，插件自行派生密钥，不读取这些设置。

默认情况下，`protect` 为每次构建生成一个全新的随机主密钥和一个**相互独立**的脚本密钥，并将其内嵌于加载器扩展中（这是基线格式的占位方案，闭源运行时改为在运行时派生密钥）。如需自行管理密钥，可在 `renmori.toml` 中指定保存密钥的环境变量，每个密钥为 64 位十六进制字符（32 字节）：

```toml
[keys]
master_env = "RENMORI_MASTER_KEY"
script_env = "RENMORI_SCRIPT_KEY"
```

请从 CI 的密钥库（secrets）中为这些变量赋值，切勿将密钥提交到仓库。若指定的变量未设置，RenMori 会回退为随机密钥并给出提示。

:::warning
RenMori 仅读取 `[keys]` 中所指定名称的环境变量。若 `renmori.toml` 中没有 `[keys]` 配置节，仅在 CI 中设置 `RENMORI_MASTER_KEY` 等环境变量不会产生任何效果，每次构建仍使用随机密钥。
:::

即使固定密钥，不同构建之间的输出也不是逐字节可复现的（每个文件使用随机盐），这是有意为之的设计。流水线应针对 `verify` 的结果与清单中的文件列表进行断言，而不应跨构建比较容器哈希。

## GitHub Actions 示例

仓库中的 [`examples/github-actions-protect.yml`](https://github.com/MewBaka/RenMori/blob/main/examples/github-actions-protect.yml) 演示了完整流程：构建游戏、`renmori protect`、`renmori verify`，然后将受保护的发行版构建上传为产物。

```yaml
# Example GitHub Actions workflow: build a Ren'Py game, protect it with renmori,
# verify the result, and upload the protected build as an artifact.
#
# Copy to .github/workflows/protect.yml and adapt the build step to your project.
# renmori runs on the CI runner (the build environment); the protected runtime
# ships inside the game and needs no Python there.

name: Protect Ren'Py build

on:
  workflow_dispatch:
  push:
    tags: ["v*"]

jobs:
  protect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install renmori
        run: pip install renmori

      # Replace this with your real Ren'Py build. It must produce a directory
      # that contains a game/ subdirectory, e.g. dist/MyGame-1.0-pc.
      - name: Build the game
        run: |
          # renpy.sh "$PWD" distribute   # or your existing build script
          echo "produce ./dist/MyGame-pc here"

      # Full protection (the default) uses the closed plugin, downloaded once from
      # the public release and verified against SHA256SUMS. Cache it between runs;
      # keep the key's tag in sync with the plugin release tag renmori pulls.
      - uses: actions/cache@v4
        with:
          path: ~/.cache/renmori/plugin
          key: renmori-plugin-${{ runner.os }}-plugin-v1.2.6

      - name: Protect
        # The plugin derives its own keys, so no key secrets are needed here. Key
        # environment variables apply only to --strength baseline, and only when
        # renmori.toml names them in its [keys] section.
        run: |
          renmori protect ./dist/MyGame-pc -o ./dist/MyGame-pc-protected --quiet

      - name: Verify
        run: renmori verify ./dist/MyGame-pc-protected

      - uses: actions/upload-artifact@v4
        with:
          name: MyGame-pc-protected
          path: ./dist/MyGame-pc-protected
```

使用方法如下：

1. 将该文件复制到项目的 `.github/workflows/protect.yml`
2. 将 Build the game 步骤替换为项目实际的 Ren'Py 构建命令，该步骤须产出一个包含 `game/` 子目录的目录
3. 按需调整触发条件；示例在手动触发或推送 `v*` 标签时运行
4. 示例已包含插件缓存步骤；升级 RenMori 后若插件发布标签变化，应同步更新缓存键

RenMori 只在 CI runner（构建环境）上运行；受保护的运行时随游戏一同分发，玩家端不需要额外安装 Python。示例在默认强度下运行，因此会在 runner 上获取闭源插件。插件自行派生密钥，因此 Protect 步骤无需配置密钥。密钥环境变量仅在使用基线格式且 `renmori.toml` 的 `[keys]` 配置节指定了这些变量名时生效，详见上文的密钥管理。

## 针对真实引擎的端到端校验（可选）

[`tools/verify_in_renpy.py`](https://github.com/MewBaka/RenMori/blob/main/tools/verify_in_renpy.py) 会保护一个示例游戏，并在真实的 Ren'Py SDK 中确认每一项资源都能逐字节无误地解密、Ren'Py 脚本已被变换且仍可解析、注入的脚本会被拒绝。使用时需指定一个 SDK 与一个游戏；在没有可用 SDK 的环境中该校验会被跳过。
